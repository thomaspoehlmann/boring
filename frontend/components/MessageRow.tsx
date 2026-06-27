"use client";

import React from "react";
import { Copy, RotateCcw, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { Message } from "@/types/message";

export const USER_BUBBLE_STYLE: React.CSSProperties = {
  background: "rgba(167,139,250,0.12)",
  border: "1px solid rgba(167,139,250,0.25)",
  color: "var(--foreground)",
};

export const ASST_BUBBLE_STYLE: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "var(--foreground)",
};

export const ACTION_BAR_STYLE: React.CSSProperties = {
  background: "rgba(10,10,20,0.85)",
  border: "1px solid rgba(255,255,255,0.1)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
};

type MessageRowProps = {
  m: Message;
  isLastAssistant: boolean;
  isSending: boolean;
  onCopy: (content: string) => void;
  onRegenerate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function MessageRowInner({
  m,
  isLastAssistant,
  isSending,
  onCopy,
  onRegenerate,
  onEdit,
  onDelete,
}: MessageRowProps) {
  const isStreaming = m.status === "streaming";
  const showActions = m.status !== "streaming";

  return (
    <div
      className={cn(
        "flex w-full message-enter",
        m.role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className="group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 assistant-bubble"
        style={m.role === "user" ? USER_BUBBLE_STYLE : ASST_BUBBLE_STYLE}
      >
        {m.content ? (
          <p className="whitespace-pre-wrap break-words">
            {m.content}
            {isStreaming && <span className="streaming-cursor" aria-hidden />}
          </p>
        ) : isStreaming ? (
          <span
            className="inline-flex items-center gap-1.5"
            style={{ color: "var(--accent)" }}
          >
            <span className="thinking-dot" />
            <span className="thinking-dot" />
            <span className="thinking-dot" />
          </span>
        ) : null}

        {showActions && (
          <div
            className={cn(
              "message-actions absolute -top-9 z-20 flex gap-1 rounded-lg p-0.5",
              m.role === "user" ? "right-0" : "left-0",
            )}
            style={ACTION_BAR_STYLE}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onCopy(m.content)}
              className="rounded p-1 action-core transition-colors"
              style={{ color: "rgba(226,232,240,0.7)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(226,232,240,0.7)")}
              aria-label="Copy message"
              title="Copy"
            >
              <Copy className="size-3.5" />
            </button>

            {m.role === "assistant" && isLastAssistant && (
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isSending}
                className="rounded p-1 action-core transition-colors disabled:opacity-30"
                style={{ color: "rgba(226,232,240,0.7)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(226,232,240,0.7)")}
                aria-label="Regenerate response"
                title="Regenerate"
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}

            {m.role === "user" && (
              <button
                type="button"
                onClick={() => onEdit(m.id)}
                disabled={isSending}
                className="rounded p-1 action-sensitive transition-colors disabled:opacity-30"
                style={{ color: "rgba(226,232,240,0.6)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(226,232,240,0.6)")}
                aria-label="Edit and resend"
                title="Edit"
              >
                <Pencil className="size-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => onDelete(m.id)}
              disabled={isSending}
              className="rounded p-1 action-sensitive transition-colors disabled:opacity-30"
              style={{ color: "rgba(226,232,240,0.6)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(226,232,240,0.6)")}
              aria-label="Delete message"
              title="Delete"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}

        {m.id !== "welcome" && (
          <span className={`message-timestamp message-timestamp--${m.role}`}>
            {formatRelativeTime(m.id)}
          </span>
        )}
      </div>
    </div>
  );
}

export const MessageRow = React.memo(MessageRowInner);
