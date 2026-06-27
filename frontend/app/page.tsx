"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SendHorizonal,
  TriangleAlert,
  Trash2,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageRow } from "@/components/MessageRow";
import type { Message } from "@/types/message";
import type { ChatRequest, ChatResponse, ChatMessage } from "@/types/chat";

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "You've reached The Void. Ask anything — I'm listening.",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const messagesRef = useRef<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isAtBottomRef = useRef(true);

  // Keep messagesRef in sync so callbacks never close over stale state
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const canSend = input.trim().length > 0 && !isSending;
  const placeholder = isSending ? "Waiting for the void..." : "Send a message into the void...";

  // Scroll listener — only fires setIsAtBottom when value actually changes
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      if (atBottom !== isAtBottomRef.current) {
        isAtBottomRef.current = atBottom;
        setIsAtBottom(atBottom);
      }
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Height adjustment — pure DOM side-effect, outside React render cycle
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const max = 160;
    const onInput = () => {
      el.style.height = "0";
      const next = Math.min(el.scrollHeight, max);
      el.style.height = next + "px";
      el.style.overflowY = next >= max ? "auto" : "hidden";
    };
    el.addEventListener("input", onInput);
    return () => el.removeEventListener("input", onInput);
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      if (isComposing) return;
      e.preventDefault();
      if (canSend) void sendMessage();
    }
  }

  function handleCompositionStart() { setIsComposing(true); }
  function handleCompositionEnd() { setIsComposing(false); }

  function cancelCurrent() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSending(false);
  }

  // Stable callbacks passed to MessageRow — won't break React.memo
  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  }, []);

  const deleteMessage = useCallback((id: string) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      if (
        next[idx].role === "user" &&
        idx + 1 < next.length &&
        next[idx + 1].role === "assistant"
      ) {
        next.splice(idx, 2);
      } else {
        next.splice(idx, 1);
      }
      return next;
    });
  }, []);

  const editAndResend = useCallback((id: string) => {
    const msgs = messagesRef.current;
    const msg = msgs.find((m) => m.id === id);
    if (!msg || msg.role !== "user") return;
    const idx = msgs.findIndex((m) => m.id === id);
    setMessages(msgs.slice(0, idx));
    setInput(msg.content);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (!el) return;
      el.focus();
      el.dispatchEvent(new Event("input"));
    });
  }, []);

  function getHistoryForRequest(): ChatMessage[] {
    return messagesRef.current
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-12)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  }

  function regenerateLast() {
    const msgs = messagesRef.current;
    const lastUserIdx = [...msgs].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const realIdx = msgs.length - 1 - lastUserIdx;
    const userMsg = msgs[realIdx];
    setMessages(msgs.slice(0, realIdx + 1));
    void sendMessage(userMsg.content, true);
  }

  function clearConversation() {
    setMessages([WELCOME_MESSAGE]);
    setError(null);
  }

  async function sendMessage(overrideText?: string, isRegenerate = false) {
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    setError(null);
    setIsSending(true);

    if (!overrideText) {
      setInput("");
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.style.height = "0";
          el.style.overflowY = "hidden";
          el.style.height = el.scrollHeight + "px";
        }
      });
    }

    let historyForTurn: ChatMessage[] = getHistoryForRequest();
    if (
      isRegenerate &&
      historyForTurn.length &&
      historyForTurn[historyForTurn.length - 1].role === "user"
    ) {
      historyForTurn = historyForTurn.slice(0, -1);
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: Message = { id: makeId(), role: "user", content: text };
    const pendingAssistant: Message = {
      id: makeId(),
      role: "assistant",
      content: "",
      status: "streaming",
    };

    if (!isRegenerate) {
      setMessages((prev) => [...prev, userMessage, pendingAssistant]);
    } else {
      setMessages((prev) => [...prev, pendingAssistant]);
    }

    queueMicrotask(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, history: historyForTurn } satisfies ChatRequest),
        signal: controller.signal,
      });

      if (!res.ok) {
        const maybeJson = await res.json().catch(() => null);
        const detail =
          (maybeJson && typeof maybeJson.error === "string" && maybeJson.error) ||
          `Request failed (${res.status})`;
        throw new Error(detail);
      }

      if (res.headers.get("content-type")?.includes("text/event-stream")) {
        const reader = res.body?.getReader();
        if (!reader) throw new Error("Empty stream");
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            if (trimmed === "data: [DONE]") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === pendingAssistant.id ? { ...m, status: "done" as const } : m,
                ),
              );
              return;
            }
            if (trimmed.startsWith("data: ")) {
              try {
                const payload = JSON.parse(trimmed.slice(6));
                if (payload.delta) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === pendingAssistant.id
                        ? { ...m, content: m.content + payload.delta }
                        : m,
                    ),
                  );
                  // Only auto-scroll when user hasn't scrolled up to read history
                  if (isAtBottomRef.current) {
                    queueMicrotask(() => {
                      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
                    });
                  }
                }
                if (payload.error) throw new Error(payload.error);
              } catch {
                // ignore partial JSON
              }
            }
          }
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === pendingAssistant.id ? { ...m, status: "done" as const } : m,
          ),
        );
        return;
      }

      const json = (await res.json().catch(() => null)) as
        | (ChatResponse & { error?: never })
        | { error?: string }
        | null;

      if (!res.ok) {
        const msg =
          (json && typeof json.error === "string" && json.error) ||
          `Request failed (${res.status})`;
        throw new Error(msg);
      }
      const reply = json && "reply" in json ? json.reply : null;
      if (!reply || typeof reply !== "string") throw new Error("Malformed API response");

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingAssistant.id ? { ...m, content: reply, status: "done" as const } : m,
        ),
      );
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "name" in err &&
        (err as { name?: string }).name === "AbortError"
      ) {
        setMessages((prev) => prev.filter((m) => m.id !== pendingAssistant.id));
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed to send message";
      setError(msg);
      setMessages((prev) => prev.filter((m) => m.id !== pendingAssistant.id));
    } finally {
      setIsSending(false);
      abortRef.current = null;
      setTimeout(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
        textareaRef.current?.focus();
      }, 0);
    }
  }

  return (
    <div
      className="relative flex h-dvh items-center justify-center overflow-hidden p-2 sm:p-4"
      style={{
        background: "var(--background)",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Nebula background blobs */}
      <div className="nebula-blob nebula-blob-1" aria-hidden />
      <div className="nebula-blob nebula-blob-2" aria-hidden />
      <div className="nebula-blob nebula-blob-3" aria-hidden />

      <div className="relative z-10 w-full max-w-[680px] h-full max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] flex flex-col">
        <Card className="p-0 flex flex-col min-h-0 flex-1">
          {/* Header */}
          <CardHeader className="flex-row items-center justify-between shrink-0 px-4 pt-4 sm:px-6 sm:pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div
                className="size-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background:
                    "radial-gradient(circle at 40% 40%, rgba(167,139,250,0.3), rgba(124,58,237,0.1) 60%, transparent 100%)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  boxShadow:
                    "0 0 16px rgba(167,139,250,0.25), inset 0 0 8px rgba(0,0,0,0.5)",
                }}
                aria-hidden
              >
                <div
                  className="size-3 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, #a78bfa 0%, #4c1d95 60%, #0a0008 100%)",
                    boxShadow: "0 0 8px rgba(167,139,250,0.6)",
                  }}
                />
              </div>
              <CardTitle>The Void</CardTitle>
            </div>

            <button
              type="button"
              onClick={clearConversation}
              className="rounded-lg p-2 transition-colors cursor-pointer"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
              aria-label="Clear conversation"
              title="Clear conversation"
            >
              <Trash2 className="size-4" />
            </button>
          </CardHeader>

          {/* Violet divider */}
          <div
            className="shrink-0 mb-0 h-px w-full"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(167,139,250,0.4) 50%, transparent)",
            }}
            aria-hidden
          />

          <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden gap-3 px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-4">
            {error ? (
              <div
                className="shrink-0 flex items-start gap-2 rounded-xl p-3 text-sm"
                style={{
                  background: "rgba(127,29,29,0.3)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#fca5a5",
                }}
              >
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Signal lost</p>
                  <p className="break-words opacity-80">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const lastUser = [...messagesRef.current]
                      .reverse()
                      .find((m) => m.role === "user");
                    setError(null);
                    if (lastUser) void sendMessage(lastUser.content);
                  }}
                  className="ml-2 shrink-0 rounded-lg px-2 py-1 text-xs font-medium transition-colors"
                  style={{
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#fca5a5",
                  }}
                  disabled={isSending}
                >
                  Retry
                </button>
              </div>
            ) : null}

            {/* Message list */}
            <div
              ref={listRef}
              className="flex-1 min-h-0 space-y-8 overflow-y-auto overflow-x-clip rounded-xl p-3 pt-10 sm:p-4 sm:pt-10"
              aria-label="Messages"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(167,139,250,0.2) transparent",
                touchAction: "pan-y",
              }}
            >
              {messages.length === 1 && messages[0].id === "welcome" ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-center select-none">
                  <div
                    className="size-16 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        "radial-gradient(circle at 40% 40%, rgba(167,139,250,0.25), rgba(124,58,237,0.08) 60%, transparent 100%)",
                      border: "1px solid rgba(167,139,250,0.25)",
                      boxShadow:
                        "0 0 40px rgba(167,139,250,0.15), inset 0 0 16px rgba(0,0,0,0.6)",
                    }}
                  >
                    <div
                      className="size-6 rounded-full"
                      style={{
                        background:
                          "radial-gradient(circle, #a78bfa 0%, #4c1d95 60%, #0a0008 100%)",
                        boxShadow: "0 0 16px rgba(167,139,250,0.7)",
                      }}
                    />
                  </div>
                  <p className="text-xs tracking-widest uppercase" style={{ color: "var(--muted)" }}>
                    Ask the darkness.
                  </p>
                  <p className="text-sm max-w-xs" style={{ color: "rgba(226,232,240,0.5)" }}>
                    {messages[0].content}
                  </p>
                </div>
              ) : (
                messages.map((m, idx) => {
                  const isLastAssistant =
                    m.role === "assistant" &&
                    idx === messages.length - 1 &&
                    (m.status === "done" || m.status === "streaming");
                  return (
                    <MessageRow
                      key={m.id}
                      m={m}
                      isLastAssistant={isLastAssistant}
                      isSending={isSending}
                      onCopy={copyToClipboard}
                      onRegenerate={regenerateLast}
                      onEdit={editAndResend}
                      onDelete={deleteMessage}
                    />
                  );
                })
              )}
            </div>

            {/* Scroll-to-bottom button */}
            {!isAtBottom && (
              <div className="shrink-0 flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    listRef.current?.scrollTo({
                      top: listRef.current.scrollHeight,
                      behavior: "smooth",
                    })
                  }
                  className="scroll-to-bottom-btn"
                  aria-label="Scroll to bottom"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                    <path
                      d="M7 2v10M3 8l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Latest
                </button>
              </div>
            )}

            {/* Input separator */}
            <div
              className="shrink-0 h-px w-full"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(167,139,250,0.15) 50%, transparent)",
              }}
              aria-hidden
            />

            {/* Input area */}
            <form
              className="shrink-0 flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSend) void sendMessage();
              }}
            >
              <label className="contents">
                <span className="sr-only">Message</span>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  placeholder={placeholder}
                  rows={1}
                  className="w-full min-h-[44px] max-h-[160px] resize-none overflow-y-hidden rounded-xl px-3 py-2.5 transition-all focus:outline-none disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--foreground)",
                    caretColor: "var(--accent)",
                    fontSize: "16px",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(167,139,250,0.5)";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(167,139,250,0.1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  disabled={isSending}
                  aria-label="Message"
                />
              </label>

              {isSending ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={cancelCurrent}
                  className="h-11 px-4"
                  aria-label="Stop generating"
                >
                  <StopCircle className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Stop</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!canSend}
                  className="h-11 px-4 send-btn"
                  aria-label="Send message"
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled)
                      e.currentTarget.style.boxShadow = "0 0 24px var(--accent-glow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <SendHorizonal className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
