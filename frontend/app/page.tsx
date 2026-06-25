"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SendHorizonal,
  Sparkles,
  TriangleAlert,
  Copy,
  RotateCcw,
  Trash2,
  Pencil,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ChatRequest, ChatResponse, ChatMessage } from "@/types/chat";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "sending" | "streaming" | "done" | "error";
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ai-coach-messages");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [
      {
        id: "welcome",
        role: "assistant",
        content: "Hi — I’m here to support you. What’s on your mind today?",
      },
    ];
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [showActionsId, setShowActionsId] = useState<string | null>(null);

  // Dismiss open action bars on outside click or Escape (best UX for tap-to-reveal)
  useEffect(() => {
    if (!showActionsId) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowActionsId(null);
    };

    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (listRef.current && !listRef.current.contains(target)) {
        setShowActionsId(null);
      }
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [showActionsId]);

  const canSend = input.trim().length > 0 && !isSending;

  const persist = (next: Message[]) => {
    try {
      localStorage.setItem("ai-coach-messages", JSON.stringify(next));
    } catch {}
  };

  // Keep only recent history for context (Vercel free friendly payload size)
  function getHistoryForRequest(): import("@/types/chat").ChatMessage[] {
    const recent = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-12)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
    return recent;
  }

  const placeholder = useMemo(() => {
    return isSending ? "Thinking…" : "Type your message…";
  }, [isSending]);

  function adjustTextareaHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 160; // ~8 lines
    el.style.height = Math.min(el.scrollHeight, max) + "px";
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    requestAnimationFrame(adjustTextareaHeight);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      if (isComposing) return;
      e.preventDefault();
      if (canSend) void sendMessage();
    }
  }

  function handleCompositionStart() {
    setIsComposing(true);
  }
  function handleCompositionEnd() {
    setIsComposing(false);
  }

  // Cancel current streaming request
  function cancelCurrent() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSending(false);
  }

  // Copy text to clipboard
  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  // Delete a message (and its paired assistant if user deletes)
  function deleteMessage(id: string) {
    setShowActionsId(null);
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      // If deleting a user message, also remove following assistant if present
      if (
        next[idx].role === "user" &&
        idx + 1 < next.length &&
        next[idx + 1].role === "assistant"
      ) {
        next.splice(idx, 2);
      } else {
        next.splice(idx, 1);
      }
      persist(next);
      return next;
    });
  }

  // Edit a previous user message and resend
  function editAndResend(id: string) {
    setShowActionsId(null);
    const msg = messages.find((m) => m.id === id);
    if (!msg || msg.role !== "user") return;
    // Remove the message and everything after it
    const idx = messages.findIndex((m) => m.id === id);
    const base = messages.slice(0, idx);
    setMessages(base);
    persist(base);
    // populate input with the old text
    setInput(msg.content);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      adjustTextareaHeight();
    });
  }

  // Regenerate last assistant reply (uses last user message)
  function regenerateLast() {
    // Find last user message
    const lastUserIdx = [...messages]
      .reverse()
      .findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const realIdx = messages.length - 1 - lastUserIdx;
    const userMsg = messages[realIdx];
    // Trim messages after that user message
    const base = messages.slice(0, realIdx + 1);
    setMessages(base);
    persist(base);
    // resend with override
    void sendMessage(userMsg.content, true);
  }

  async function sendMessage(overrideText?: string, isRegenerate = false) {
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    setShowActionsId(null);
    setError(null);
    setIsSending(true);

    if (!overrideText) {
      setInput("");
      requestAnimationFrame(() => {
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      });
    }

    // Snapshot history *before* optimistic UI update.
    // For normal send: history is everything before the new user message.
    // For regenerate: the state ends with the user message we are re-asking,
    // so we drop the last user turn (the `message` field carries it).
    let historyForTurn: ChatMessage[] = getHistoryForRequest();
    if (
      isRegenerate &&
      historyForTurn.length &&
      historyForTurn[historyForTurn.length - 1].role === "user"
    ) {
      historyForTurn = historyForTurn.slice(0, -1);
    }

    // Abort controller for this request
    const controller = new AbortController();
    abortRef.current = controller;

    const userMessage: Message = {
      id: makeId(),
      role: "user",
      content: text,
    };
    const pendingAssistant: Message = {
      id: makeId(),
      role: "assistant",
      content: "",
      status: "streaming",
    };

    // Optimistic UI
    if (!isRegenerate) {
      setMessages((prev) => {
        const next = [...prev, userMessage, pendingAssistant];
        persist(next);
        return next;
      });
    } else {
      setMessages((prev) => {
        const next = [...prev, pendingAssistant];
        persist(next);
        return next;
      });
    }

    queueMicrotask(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: historyForTurn,
        } satisfies ChatRequest),
        signal: controller.signal,
      });

      if (!res.ok) {
        const maybeJson = await res.json().catch(() => null);
        const detail =
          (maybeJson &&
            typeof maybeJson.error === "string" &&
            maybeJson.error) ||
          `Request failed (${res.status})`;
        throw new Error(detail);
      }

      // Streaming
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
              setMessages((prev) => {
                const next = prev.map((m) =>
                  m.id === pendingAssistant.id
                    ? { ...m, status: "done" as const }
                    : m,
                );
                persist(next);
                return next;
              });
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
                  queueMicrotask(() => {
                    listRef.current?.scrollTo({
                      top: listRef.current.scrollHeight,
                    });
                  });
                }
                if (payload.error) throw new Error(payload.error);
              } catch {
                // ignore partial
              }
            }
          }
        }

        // If we exit loop without DONE, mark done
        setMessages((prev) => {
          const next = prev.map((m) =>
            m.id === pendingAssistant.id
              ? { ...m, status: "done" as const }
              : m,
          );
          persist(next);
          return next;
        });
        return;
      }

      // Non-stream fallback
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
      if (!reply || typeof reply !== "string") {
        throw new Error("Malformed API response");
      }

      setMessages((prev) => {
        const next = prev.map((m) =>
          m.id === pendingAssistant.id
            ? { ...m, content: reply, status: "done" as const }
            : m,
        );
        persist(next);
        return next;
      });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "name" in err &&
        (err as { name?: string }).name === "AbortError"
      ) {
        setMessages((prev) => {
          const next = prev.filter((m) => m.id !== pendingAssistant.id);
          persist(next);
          return next;
        });
        return;
      }
      const msg = err instanceof Error ? err.message : "Failed to send message";
      setError(msg);
      setMessages((prev) => {
        const next = prev.filter((m) => m.id !== pendingAssistant.id);
        persist(next);
        return next;
      });
    } finally {
      setIsSending(false);
      abortRef.current = null;
      queueMicrotask(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
        textareaRef.current?.focus();
      });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-3xl">
        <Card className="p-4 sm:p-6">
          <CardHeader className="flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-white">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <CardTitle>AI Coach</CardTitle>
            </div>
            <p className="text-xs text-muted">POST → /api/chat</p>
          </CardHeader>

          <CardContent className="space-y-4">
            {error ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Couldn’t send message</p>
                  <p className="break-words">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const lastUser = [...messages]
                      .reverse()
                      .find((m) => m.role === "user");
                    setError(null);
                    if (lastUser) {
                      void sendMessage(lastUser.content);
                    }
                  }}
                  className="ml-2 shrink-0 rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  disabled={isSending}
                >
                  Retry
                </button>
              </div>
            ) : null}

            <div
              ref={listRef}
              className="max-h-[60vh] space-y-3 overflow-y-auto overflow-x-hidden rounded-xl bg-slate-50 p-3 sm:p-4"
              aria-label="Messages"
            >
              {messages.map((m, idx) => {
                const isStreaming = m.status === "streaming";
                const isLastAssistant =
                  m.role === "assistant" &&
                  idx === messages.length - 1 &&
                  (m.status === "done" || m.status === "streaming");
                const showActions = m.role === "assistant" || m.role === "user";

                return (
                  <div
                    key={m.id}
                    className={cn(
                      "group flex w-full message-enter",
                      m.role === "user" ? "justify-end" : "justify-start",
                    )}
                    onClick={() => {
                      // Tap / click the bubble to reveal actions (great for touch, harmless on desktop)
                      setShowActionsId((prev) => (prev === m.id ? null : m.id));
                    }}
                  >
                    <div
                      className={cn(
                        "relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm assistant-bubble",
                        m.role === "user"
                          ? "bg-primary text-white"
                          : "bg-white text-heading",
                      )}
                      onClick={(e) => {
                        // Prevent bubble toggle when clicking directly inside the floating action bar
                        if ((e.target as HTMLElement).closest(".message-actions")) {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {m.content ? (
                        <p className="whitespace-pre-wrap break-words">
                          {m.content}
                          {isStreaming && (
                            <span className="streaming-cursor" aria-hidden />
                          )}
                        </p>
                      ) : isStreaming ? (
                        <span className="inline-flex items-center gap-1 text-muted">
                          Thinking
                          <span className="thinking-dot" />
                          <span className="thinking-dot" />
                          <span className="thinking-dot" />
                        </span>
                      ) : null}

                      {/* Action bar: hover + focus + tap-to-reveal.
                          Edit/Delete are "sensitive" and stay low-profile until intent.
                          Hidden entirely while the assistant message is actively streaming. */}
                      {showActions && m.status !== "streaming" && (
                        <div
                          className={cn(
                            "message-actions absolute -top-2 z-20 flex gap-1 rounded-lg border border-white/30 bg-white/90 p-0.5 shadow-sm backdrop-blur",
                            m.role === "user" ? "left-2" : "right-2",
                            showActionsId === m.id && "message-actions--visible",
                          )}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Core actions - visible on hover/focus/tap */}
                          <button
                            type="button"
                            onClick={() => copyToClipboard(m.content)}
                            className="rounded p-1 text-muted hover:bg-slate-100 hover:text-heading action-core"
                            aria-label="Copy message"
                            title="Copy"
                          >
                            <Copy className="size-3.5" />
                          </button>

                          {m.role === "assistant" && isLastAssistant && (
                            <button
                              type="button"
                              onClick={regenerateLast}
                              disabled={isSending}
                              className="rounded p-1 text-muted hover:bg-slate-100 hover:text-heading disabled:opacity-50 action-core"
                              aria-label="Regenerate response"
                              title="Regenerate"
                            >
                              <RotateCcw className="size-3.5" />
                            </button>
                          )}

                          {/* Sensitive actions (Edit/Delete) - strictly hover/focus/tap revealed */}
                          {m.role === "user" && (
                            <button
                              type="button"
                              onClick={() => editAndResend(m.id)}
                              disabled={isSending}
                              className="rounded p-1 text-muted hover:bg-slate-100 hover:text-heading disabled:opacity-50 action-sensitive"
                              aria-label="Edit and resend"
                              title="Edit"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => deleteMessage(m.id)}
                            disabled={isSending}
                            className="rounded p-1 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50 action-sensitive"
                            aria-label="Delete message"
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSend) void sendMessage();
              }}
            >
              <label className="flex-1 text-sm font-medium text-heading">
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
                  className="w-full min-h-[44px] resize-none overflow-y-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-heading shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60"
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
                  className="h-11 px-4"
                  aria-label="Send message"
                >
                  <SendHorizonal className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Send</span>
                </Button>
              )}
            </form>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  const welcome = {
                    id: "welcome",
                    role: "assistant" as const,
                    content:
                      "Hi — I’m here to support you. What’s on your mind today?",
                  };
                  setMessages([welcome]);
                  persist([welcome]);
                  setError(null);
                }}
                className="text-[11px] text-muted hover:text-heading underline-offset-2 hover:underline"
              >
                Clear conversation
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
