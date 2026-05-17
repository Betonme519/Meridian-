/**
 * Course API — Supabase 实现（`course` 表）。
 *
 * 数据模型见 docs/DATA_MODEL.md § 3.2。
 *
 * 设计要点：
 *  - 用户私有（D5=a），RLS owner-only；切账号必须重拉
 *  - 一行 = 用户 × 某学期 × 某门课；允许同 (user, code, semester) 多行（重修 / 替代规则）
 *  - status 五档（'planned' / 'enrolled' / 'completed' / 'dropped' / 'failed'）
 *  - category 七档（'必修' / '选修' / '公选' / '通识' / '体育' / '实践' / '第二课堂'）；null = 未分类
 *  - grade_letter 是真值，grade_point 是冗余的 numeric 缓存（避免每次 GPA 查询都要 letter→point map）
 *
 * 公共 API:
 *  - listCourses(userId)          该用户所有课，按 (semester desc nulls last, created_at desc) 排
 *  - createCourse({...})          写入
 *  - updateCourse(id, patch)      部分字段更新
 *  - deleteCourse(id)             硬删
 *
 * 切后端只动本文件。
 */

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { failApiCall } from "@/lib/errorBus";
import type { Database } from "@/types/db";

// status 五档 —— 与 DB CHECK 约束对齐
export const COURSE_STATUSES = ["planned", "enrolled", "completed", "dropped", "failed"] as const;
export type CourseStatus = (typeof COURSE_STATUSES)[number];

// category 七档（null = 未分类，作为单独一档不放进数组）
export const COURSE_CATEGORIES = [
  "必修",
  "选修",
  "公选",
  "通识",
  "体育",
  "实践",
  "第二课堂",
] as const;
export type CourseCategory = (typeof COURSE_CATEGORIES)[number];

type CourseRow = Database["public"]["Tables"]["course"]["Row"];
type CourseInsert = Database["public"]["Tables"]["course"]["Insert"];
type CourseUpdate = Database["public"]["Tables"]["course"]["Update"];

/**
 * Course shape —— DB 行类型派生 + 业务层 narrowing。
 *   - `status`: DB 是宽口 `string`，业务层窄到 `CourseStatus`
 *   - `category`: DB 是宽口 `string | null`，业务层窄到 `CourseCategory | null`
 * 列集合自动跟随 db.ts。
 */
export type Course = Omit<CourseRow, "status" | "category"> & {
  status: CourseStatus;
  category: CourseCategory | null;
};

const NOT_CONFIGURED_MSG =
  "Supabase 未配置：请在 .env.local 设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY 后重启 dev server。";

/**
 * 拉用户所有课程。
 *
 * 命中索引：idx_course_user_semester (user_id, semester) + idx_course_user_status。
 * 排序：semester desc nulls last（最近学期在前，未填学期沉到末尾）。
 * 同学期内按 created_at desc，最近录入在前。
 * status / category 过滤都在 hook / UI 层做（DB 一次拉全，简化逻辑）。
 */
export async function listCourses(userId: string): Promise<Course[]> {
  if (!isSupabaseConfigured) failApiCall("course.list", NOT_CONFIGURED_MSG);
  const { data, error } = await supabase
    .from("course")
    .select("*")
    .eq("user_id", userId)
    .order("semester", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) failApiCall("course.list", error.message);
  return (data ?? []) as Course[];
}

export interface CreateCourseInput {
  userId: string;
  code: string;
  name: string;
  credits?: number | null;
  category?: CourseCategory | null;
  semester?: string | null;
  status?: CourseStatus;
  grade_letter?: string | null;
  grade_point?: number | null;
  counts_in_gpa?: boolean;
  instructor?: string | null;
  notes?: string | null;
}

/**
 * 新建一条 course。status 缺省走表默认 'planned'，counts_in_gpa 缺省 true。
 */
export async function createCourse(input: CreateCourseInput): Promise<Course> {
  if (!isSupabaseConfigured) failApiCall("course.create", NOT_CONFIGURED_MSG);

  const row: CourseInsert = {
    user_id: input.userId,
    code: input.code,
    name: input.name,
  };
  if (input.credits !== undefined) row.credits = input.credits;
  if (input.category !== undefined) row.category = input.category;
  if (input.semester !== undefined) row.semester = input.semester;
  if (input.status !== undefined) row.status = input.status;
  if (input.grade_letter !== undefined) row.grade_letter = input.grade_letter;
  if (input.grade_point !== undefined) row.grade_point = input.grade_point;
  if (input.counts_in_gpa !== undefined) row.counts_in_gpa = input.counts_in_gpa;
  if (input.instructor !== undefined) row.instructor = input.instructor;
  if (input.notes !== undefined) row.notes = input.notes;

  const { data, error } = await supabase.from("course").insert(row).select().single();
  if (error || !data) {
    failApiCall("course.create", `新建课程失败：${error?.message ?? "未知错误"}`);
  }
  return data as Course;
}

export type CoursePatch = Partial<Omit<Course, "id" | "user_id" | "created_at" | "updated_at">>;

/**
 * 部分字段更新。`updated_at` 由 trigger 维护，前端不要 set。
 */
export async function updateCourse(id: string, patch: CoursePatch): Promise<Course> {
  if (!isSupabaseConfigured) failApiCall("course.update", NOT_CONFIGURED_MSG);

  const update: CourseUpdate = { ...patch };
  const { data, error } = await supabase
    .from("course")
    .update(update)
    .eq("id", id)
    .select()
    .single();
  if (error || !data) {
    failApiCall("course.update", `更新课程失败：${error?.message ?? "未知错误"}`);
  }
  return data as Course;
}

/**
 * 硬删一条 course。RLS 限定 user_id = auth.uid()，跨账号删不到。
 */
export async function deleteCourse(id: string): Promise<void> {
  if (!isSupabaseConfigured) failApiCall("course.delete", NOT_CONFIGURED_MSG);
  const { error } = await supabase.from("course").delete().eq("id", id);
  if (error) failApiCall("course.delete", `删除课程失败：${error.message}`);
}
