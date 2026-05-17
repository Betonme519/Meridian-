import { useCallback, useEffect, useRef, useState } from "react";
import * as chatMessageApi from "@/api/chatMessageApi";
import type {
  ChatMessage,
  ChatMessageMetadata,
  ConversationSummary,
} from "@/api/chatMessageApi";
import type { GoalMode } from "@/api/profileApi";
import { useAuth } from "@/hooks/useAuth";
import { randomUUID } from "@/lib/uuid";

/**
 * useChatMessages —— /ai-advisor 页对话历史本地态。
 *
 * 跟 usePlans 同款"requestIdRef + loadedUserIdRef + auth-loading 短路"三件套，
 * 但简单很多：
 *   - chat_message 不可变 → 没有 debounce / saving 概念，只是 INSERT / DELETE
 *   - 一轮推荐 = 一个 conversation_id（两条消息：user + assistant）
 *   - 没有"当前正在写"的 conversation，写完即 finalize
 *
 * 公共 API：
 *   conversations          会话摘要列表（最近 N 条，按 last_at desc）
 *   loading                列表加载中
 *   error                  最近一次操作的错误（列表 / persist / 删除）
 *   activeConversationId   用户当前在查看的历史会话（null = 不在查看）
 *   activeMessages         active 会话的所有消息（按 created_at asc）
 *   loadingActive          active 会话加载中
 *
 *   persistRound({...})    流式一轮结束后调用，写两条 message，返回新 conv id
 *   selectConversation(id) 选中历史会话 → 拉详情进 activeMessages
 *   clearActive()          退出"查看历史"模式（让 /ai-advisor 回到 live 流式态）
 *   remove(id)             硬删一个 conversation
 */

const DEFAULT_LIST_LIMIT_ROWS = 100;

export interface PersistRoundInput {
  userMessage: string;
  assistantMessage: string;
  /** 解析出来的 goal_mode；解析失败给 null */
  mode: GoalMode | null;
  /** 流式是否被中途取消（按 abort 路径走的） */
  aborted: boolean;
}

export interface UseChatMessagesValue {
  conversations: ConversationSummary[];
  loading: boolean;
  error: string | null;

  activeConversationId: string | null;
  activeMessages: ChatMessage[];
  loadingActive: boolean;

  persistRound: (input: PersistRoundInput) => Promise<string | null>;
  selectConversation: (id: string | null) => void;
  clearActive: () => void;
  remove: (id: string) => Promise<void>;
}

export function useChatMessages(): UseChatMessagesValue {
  const { user, loading: authLoading } = useAuth();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(
    null,
  );
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [loadingActive, setLoadingActive] = useState(false);

  // race 守卫：list / active 各一份
  const listReqIdRef = useRef(0);
  const activeReqIdRef = useRef(0);
  // 防 AuthContext re-emit（token refresh）触发同 user.id 重拉
  const loadedUserIdRef = useRef<string | null>(null);

  /**
   * 拉列表。reqId 守 race（快速切账号时旧响应不要覆盖新结果）。
   */
  const loadList = useCallback(async (userId: string) => {
    const reqId = ++listReqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const rows = await chatMessageApi.listConversations(
        userId,
        DEFAULT_LIST_LIMIT_ROWS,
      );
      if (reqId !== listReqIdRef.current) return;
      setConversations(rows);
    } catch (e) {
      if (reqId !== listReqIdRef.current) return;
      const msg = e instanceof Error ? e.message : "加载对话历史失败";
      setError(msg);
      setConversations([]);
    } finally {
      if (reqId === listReqIdRef.current) setLoading(false);
    }
  }, []);

  // 登入 → 拉列表；登出 → 全清。user 对象引用变化但 id 未变时不重拉。
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      listReqIdRef.current++;
      activeReqIdRef.current++;
      loadedUserIdRef.current = null;
      setConversations([]);
      setActiveConversationId(null);
      setActiveMessages([]);
      setLoading(false);
      return;
    }
    if (loadedUserIdRef.current === user.id) return;
    loadedUserIdRef.current = user.id;
    void loadList(user.id);
  }, [authLoading, user, loadList]);

  /**
   * 选中历史会话 → 拉详情。传 null 等于 clearActive。
   */
  const selectConversation = useCallback((id: string | null) => {
    if (id === null) {
      activeReqIdRef.current++;
      setActiveConversationId(null);
      setActiveMessages([]);
      setLoadingActive(false);
      return;
    }
    setActiveConversationId(id);
    const reqId = ++activeReqIdRef.current;
    setLoadingActive(true);
    void (async () => {
      try {
        const msgs = await chatMessageApi.listConversationMessages(id);
        if (reqId !== activeReqIdRef.current) return;
        setActiveMessages(msgs);
      } catch (e) {
        if (reqId !== activeReqIdRef.current) return;
        const msg = e instanceof Error ? e.message : "加载对话内容失败";
        setError(msg);
        setActiveMessages([]);
      } finally {
        if (reqId === activeReqIdRef.current) setLoadingActive(false);
      }
    })();
  }, []);

  const clearActive = useCallback(() => selectConversation(null), [
    selectConversation,
  ]);

  /**
   * 流式一轮结束后调用，写两条 message。返回新 conv id（null 表示未登录或失败）。
   * 顺序：先 user → 再 assistant（保 created_at 升序符合时间正序）。
   *
   * 失败策略：任一条写入抛错 → 状态不滚（不删已写的那条），让用户重试或查 DB。
   * 列表 refresh：成功后乐观 prepend 一条 summary，避免再拉一次列表。
   */
  const persistRound = useCallback(
    async (input: PersistRoundInput): Promise<string | null> => {
      if (!user) return null;
      const userId = user.id;
      const conversationId = randomUUID();
      const meta: ChatMessageMetadata = input.aborted ? { aborted: true } : {};

      try {
        await chatMessageApi.insertChatMessage({
          userId,
          conversationId,
          role: "user",
          content: input.userMessage,
          mode: input.mode,
        });
        await chatMessageApi.insertChatMessage({
          userId,
          conversationId,
          role: "assistant",
          content: input.assistantMessage,
          mode: input.mode,
          metadata: meta,
        });

        // 乐观 prepend；preview 用 user 输入前 60 字（与 listConversations 一致）
        const preview =
          input.userMessage.length > 60
            ? input.userMessage.slice(0, 60) + "…"
            : input.userMessage;
        setConversations((prev) => [
          {
            conversation_id: conversationId,
            preview,
            mode: input.mode,
            aborted: input.aborted,
            last_at: new Date().toISOString(),
            message_count: 2,
          },
          ...prev,
        ]);

        return conversationId;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "保存对话失败";
        setError(msg);
        return null;
      }
    },
    [user],
  );

  /**
   * 硬删一个 conversation。删完：active 是它就清 active；列表里也丢掉。
   */
  const remove = useCallback(
    async (id: string) => {
      if (!user) return;
      try {
        await chatMessageApi.deleteConversation(user.id, id);
        setConversations((prev) => prev.filter((c) => c.conversation_id !== id));
        if (activeConversationId === id) {
          activeReqIdRef.current++;
          setActiveConversationId(null);
          setActiveMessages([]);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "删除对话失败";
        setError(msg);
        throw e;
      }
    },
    [user, activeConversationId],
  );

  return {
    conversations,
    loading,
    error,
    activeConversationId,
    activeMessages,
    loadingActive,
    persistRound,
    selectConversation,
    clearActive,
    remove,
  };
}
