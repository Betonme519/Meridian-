import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { exitGuestMode } from "@/lib/guestMode";
import FeedbackDialog from "@/components/feedback/FeedbackDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  Sparkles,
  UserRound,
  HelpCircle,
  LogOut,
} from "lucide-react";

/**
 * 全站统一的「已登录用户」头像菜单。
 *
 * 调用方只负责传入 trigger（头像按钮的具体外观随页面背景变化），
 * 下拉面板的内容、顺序、交互、动效在这里集中维护。
 *
 * modal={false} 是必需的：默认 Radix 在打开时会锁 body 滚动并加
 * padding-right 抵消滚动条，导致 fixed 定位的导航栏整条向右跳一下，
 * 同时把面板的入场动画也吃掉。设为 false 后两个问题一起解决。
 */
export function UserMenu({ trigger }: { trigger: ReactNode }) {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // 显示名优先级：profile.name > auth.user.name (来自注册时 metadata) > email
  // profile 加载完成前后无缝切换，无需 loading state
  const displayName = profile?.name ?? user?.name ?? user?.email ?? "";

  const handleLogout = async () => {
    await logout();
    exitGuestMode();
    navigate({ to: "/" });
  };

  // 暂时所有非登出项都跳转到 /dashboard——项目还没有对应路由，
  // 等业务页就位后只在这里改一处。
  const goDashboard = () => navigate({ to: "/dashboard" });

  // 交互只改颜色——任何 transform（translate/rotate/scale）放在 4×4 的小图标上
  // 都会显得抽搐。Apple-like 的克制：底色 + 文字 + 图标颜色一起平滑过渡。
  const itemBase =
    "cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors duration-150 ease-out " +
    "[&>svg]:transition-colors [&>svg]:duration-150";
  const itemNeutral =
    itemBase +
    " text-slate-700 focus:bg-slate-50 focus:text-slate-950" +
    " focus:[&>svg]:text-slate-900";
  const itemUpgrade =
    itemBase +
    " font-medium text-amber-900 bg-gradient-to-r from-amber-50/80 to-orange-50/80" +
    " focus:from-amber-100 focus:to-orange-100 focus:text-amber-950";
  const itemDanger =
    itemBase + " text-red-600 focus:bg-red-50 focus:text-red-700";

  return (
    <>
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="w-64 rounded-2xl border border-slate-200/70 bg-white/95 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl origin-top-right data-[state=open]:duration-200 data-[state=closed]:duration-150 data-[state=open]:ease-out"
      >
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-3 py-2.5">
          <span className="text-sm font-medium text-slate-900 truncate">
            {displayName}
          </span>
          <span className="text-xs font-normal text-slate-500 truncate">
            {user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1 bg-slate-100" />

        <DropdownMenuItem onSelect={goDashboard} className={itemNeutral}>
          <UserRound className="mr-2.5 h-4 w-4 text-slate-500" strokeWidth={1.7} />
          个人资料
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={goDashboard} className={itemUpgrade}>
          <Sparkles className="mr-2.5 h-4 w-4 text-amber-600" strokeWidth={1.7} />
          Upgrade plan
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={goDashboard} className={itemNeutral}>
          <Settings className="mr-2.5 h-4 w-4 text-slate-500" strokeWidth={1.7} />
          设置
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setFeedbackOpen(true)} className={itemNeutral}>
          <HelpCircle className="mr-2.5 h-4 w-4 text-slate-500" strokeWidth={1.7} />
          帮助
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1 bg-slate-100" />
        <DropdownMenuItem onSelect={handleLogout} className={itemDanger}>
          <LogOut className="mr-2.5 h-4 w-4" strokeWidth={1.7} />
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </>
  );
}
