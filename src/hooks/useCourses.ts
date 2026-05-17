import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as courseApi from "@/api/courseApi";
import type { Course, CourseStatus, CreateCourseInput, CoursePatch } from "@/api/courseApi";
import { useAuth } from "@/hooks/useAuth";

/**
 * useCourses —— /import 页"我已修的课"列表本地态，同时给排队 12 画布
 * 判断"某 option 是否已修"提供查询入口（按 code 命中）。
 *
 * race / re-emit 守卫沿用 [[useRules]] / [[useChatMessages]] 三件套：
 *   - requestIdRef：递增序号，回调比对；切账号 / 重复触发时旧响应不能覆盖新结果
 *   - loadedUserIdRef：记已经加载过的 user.id；AuthContext re-emit（token refresh）
 *     不会触发同 id 重拉
 *   - authLoading 期短路：等 auth 决定状态再拉
 *
 * 派生 view 都走 useMemo，避免渲染时重算。
 *
 * 公共 API：
 *   courses                 当前用户所有 course 原始行（已按 semester desc 排）
 *   coursesBySemester       按 semester 分组（for 学期成绩单）；semester=null 在末尾
 *   coursesByStatus         按 status 分组（for 已修 / 计划区分）
 *   courseCodeMap           code → Course[] 索引（重修允许多行，所以是数组）
 *   completedCodes          status='completed' 的 code 集合（画布最常用，单独缓存）
 *   loading / error         IO 状态
 *   createCourse / updateCourse / removeCourse  CRUD
 *   refresh                 强制重拉
 */

export interface CoursesBySemester {
  semester: string | null;
  items: Course[];
}

interface UseCoursesValue {
  courses: Course[];
  coursesBySemester: CoursesBySemester[];
  coursesByStatus: Record<CourseStatus, Course[]>;
  courseCodeMap: Map<string, Course[]>;
  completedCodes: Set<string>;
  loading: boolean;
  error: string | null;
  createCourse: (input: Omit<CreateCourseInput, "userId">) => Promise<Course | null>;
  updateCourse: (id: string, patch: CoursePatch) => Promise<Course | null>;
  removeCourse: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCourses(): UseCoursesValue {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  // loading 初值 true：避免首次渲染时空列表 + "0 条记录" 闪一下，等 useEffect
  // 决定要不要拉再切回 false。
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const loadedUserIdRef = useRef<string | null>(null);

  const load = useCallback(async (userId: string) => {
    const reqId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const rows = await courseApi.listCourses(userId);
      if (reqId !== requestIdRef.current) return;
      setCourses(rows);
    } catch (e) {
      if (reqId !== requestIdRef.current) return;
      const msg = e instanceof Error ? e.message : "加载课程失败";
      setError(msg);
      setCourses([]);
    } finally {
      if (reqId === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      requestIdRef.current++;
      loadedUserIdRef.current = null;
      setCourses([]);
      setLoading(false);
      setError(null);
      return;
    }
    if (loadedUserIdRef.current === user.id) return;
    loadedUserIdRef.current = user.id;
    void load(user.id);
  }, [user, authLoading, load]);

  const refresh = useCallback(async () => {
    if (!user) return;
    await load(user.id);
  }, [user, load]);

  /* ───────────────────────── CRUD ───────────────────────── */

  const createCourse = useCallback(
    async (input: Omit<CreateCourseInput, "userId">): Promise<Course | null> => {
      if (!user) {
        setError("请先登录后再录入课程");
        return null;
      }
      setError(null);
      try {
        const saved = await courseApi.createCourse({
          userId: user.id,
          ...input,
        });
        // 乐观插入；list 排序是 (semester desc, created_at desc)，最近录入放最前
        setCourses((prev) => [saved, ...prev]);
        return saved;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "新建课程失败";
        setError(msg);
        return null;
      }
    },
    [user],
  );

  const updateCourse = useCallback(
    async (id: string, patch: CoursePatch): Promise<Course | null> => {
      const prev = courses;
      // 乐观本地 patch
      setCourses((curr) => curr.map((c) => (c.id === id ? ({ ...c, ...patch } as Course) : c)));
      setError(null);
      try {
        const updated = await courseApi.updateCourse(id, patch);
        setCourses((curr) => curr.map((c) => (c.id === id ? updated : c)));
        return updated;
      } catch (e) {
        setCourses(prev);
        const msg = e instanceof Error ? e.message : "更新课程失败";
        setError(msg);
        return null;
      }
    },
    [courses],
  );

  const removeCourse = useCallback(
    async (id: string) => {
      const prev = courses;
      setCourses((curr) => curr.filter((c) => c.id !== id));
      setError(null);
      try {
        await courseApi.deleteCourse(id);
      } catch (e) {
        setCourses(prev);
        const msg = e instanceof Error ? e.message : "删除课程失败";
        setError(msg);
        throw e;
      }
    },
    [courses],
  );

  /* ───────────────────────── 派生 view ───────────────────────── */

  // 按 semester 分组保序：courses 已经按 semester desc（nulls last）排，
  // 顺序遍历即可压成 [{ semester, items }]。
  const coursesBySemester = useMemo<CoursesBySemester[]>(() => {
    const map = new Map<string | null, Course[]>();
    for (const c of courses) {
      const key = c.semester ?? null;
      const list = map.get(key);
      if (list) list.push(c);
      else map.set(key, [c]);
    }
    return Array.from(map, ([semester, items]) => ({ semester, items }));
  }, [courses]);

  const coursesByStatus = useMemo<Record<CourseStatus, Course[]>>(() => {
    const out: Record<CourseStatus, Course[]> = {
      planned: [],
      enrolled: [],
      completed: [],
      dropped: [],
      failed: [],
    };
    for (const c of courses) out[c.status].push(c);
    return out;
  }, [courses]);

  const courseCodeMap = useMemo<Map<string, Course[]>>(() => {
    const m = new Map<string, Course[]>();
    for (const c of courses) {
      const list = m.get(c.code);
      if (list) list.push(c);
      else m.set(c.code, [c]);
    }
    return m;
  }, [courses]);

  const completedCodes = useMemo<Set<string>>(() => {
    const s = new Set<string>();
    for (const c of courses) if (c.status === "completed") s.add(c.code);
    return s;
  }, [courses]);

  return {
    courses,
    coursesBySemester,
    coursesByStatus,
    courseCodeMap,
    completedCodes,
    loading,
    error,
    createCourse,
    updateCourse,
    removeCourse,
    refresh,
  };
}
