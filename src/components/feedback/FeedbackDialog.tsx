import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, Loader2, MessageSquare, Send, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { submitFeedback } from "@/api/feedbackApi";

/**
 * 问题反馈弹窗 —— 头像菜单「帮助」触发（受控）。
 *
 * 毛玻璃白色微透框（bg-white/70 + backdrop-blur-2xl + border-white/50）；发送按钮
 * 走全站品牌渐变。提交写 feedback 表（owner-insert，见 feedbackApi）。
 */
export default function FeedbackDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  const reset = () => {
    setText("");
    setStatus("idle");
    setErr(null);
  };

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || status === "sending") return;
    if (!user) {
      setErr("请先登录后再反馈。");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setErr(null);
    try {
      await submitFeedback({
        userId: user.id,
        email: user.email ?? null,
        message: msg,
        page: typeof window !== "undefined" ? window.location.pathname : null,
      });
      setStatus("done");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "提交失败，请稍后再试。");
      setStatus("error");
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) reset();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl backdrop-blur-2xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-slate-600" strokeWidth={1.7} />
            <Dialog.Title className="text-base font-semibold tracking-tight text-slate-950">
              问题反馈
            </Dialog.Title>
          </div>
          <Dialog.Description className="mt-1 text-xs leading-5 text-slate-500">
            遇到 bug 或有建议？写下来，我们会看到。
          </Dialog.Description>

          {status === "done" ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CheckCircle2 className="h-9 w-9 text-maya" />
              <p className="text-sm font-medium text-slate-800">已收到，谢谢反馈！</p>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="mt-1 text-xs text-slate-500 transition-colors hover:text-slate-800"
              >
                关闭
              </button>
            </div>
          ) : (
            <>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                maxLength={2000}
                placeholder="描述你遇到的问题或建议…"
                className="mt-4 block w-full resize-none rounded-xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
              />
              {err && <p className="mt-2 text-xs leading-5 text-flame">{err}</p>}
              <div className="mt-4 flex items-center justify-end gap-2">
                <Dialog.Close className="rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:text-slate-800">
                  取消
                </Dialog.Close>
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!text.trim() || status === "sending"}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-gradient px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {status === "sending" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  发送
                </button>
              </div>
            </>
          )}

          <Dialog.Close className="absolute right-3 top-3 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-700">
            <X className="h-4 w-4" />
            <span className="sr-only">关闭</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
