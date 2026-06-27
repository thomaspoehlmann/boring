# The Void Rebrand — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand the "AI Coach" chat app as "The Void" — a deep-space glassmorphism chatbot — by replacing all visual/branding layers while keeping chat logic intact.

**Architecture:** Pure CSS/TSX visual replacement. No new npm packages. No API or logic changes. Five files modified: globals.css, layout.tsx, page.tsx, card.tsx, button.tsx.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS v4, lucide-react, next/font/google (Inter)

## Global Constraints

- Do NOT modify `app/api/chat/route.ts`, `types/chat.ts`, or `lib/utils.ts`
- Do NOT install new npm packages
- Inter font loaded via `next/font/google` — already available, no install needed
- Tailwind v4 syntax: use `@theme inline` block in globals.css, NOT tailwind.config.js
- localStorage key: `the-void-messages` (changed from `ai-coach-messages`)
- All functional chat logic (streaming, abort, edit, regenerate, delete) must remain identical
- No emojis in UI

---

### Task 1: Update globals.css — dark theme, nebula animation, glass styles

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Produces: CSS custom properties consumed by all other tasks:
  - `--background: #050508`
  - `--foreground: #e2e8f0`
  - `--accent: #a78bfa`
  - `--accent-glow: rgba(167,139,250,0.3)`
  - `--glass: rgba(255,255,255,0.04)`
  - `--glass-border: rgba(255,255,255,0.08)`
  - `--muted: rgba(226,232,240,0.4)`
  - `--heading: #e2e8f0`
  - `--primary: #1e293b`
  - `.nebula-blob` class for background gradient blobs
  - `@keyframes nebulaDrift` — gentle position drift
  - `@keyframes thinking-float` — horizontal float for thinking dots
  - `.streaming-cursor` color set to `var(--accent)`
  - `.message-actions` dark glass style

- [ ] **Step 1: Replace globals.css entirely**

Write the following complete content to `app/globals.css`:

```css
@import "tailwindcss";

:root {
  --background: #050508;
  --foreground: #e2e8f0;
  --primary: #1e293b;
  --accent: #a78bfa;
  --accent-glow: rgba(167, 139, 250, 0.3);
  --muted: rgba(226, 232, 240, 0.4);
  --heading: #e2e8f0;
  --glass: rgba(255, 255, 255, 0.04);
  --glass-border: rgba(255, 255, 255, 0.08);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-accent: var(--accent);
  --color-muted: var(--muted);
  --color-heading: var(--heading);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-geist-mono);
}

html,
body {
  height: 100%;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-inter), system-ui, sans-serif;
}

/* ── Nebula background blobs ── */
.nebula-blob {
  position: fixed;
  border-radius: 9999px;
  filter: blur(120px);
  opacity: 0.55;
  pointer-events: none;
  z-index: 0;
}

.nebula-blob-1 {
  width: 700px;
  height: 700px;
  background: radial-gradient(circle, #1a0533, transparent 70%);
  top: -200px;
  left: -200px;
  animation: nebulaDrift1 22s ease-in-out infinite alternate;
}

.nebula-blob-2 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, #0d1a3e, transparent 70%);
  bottom: -150px;
  right: -150px;
  animation: nebulaDrift2 26s ease-in-out infinite alternate;
}

.nebula-blob-3 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, #2d0a4e, transparent 70%);
  top: 40%;
  right: 10%;
  animation: nebulaDrift3 18s ease-in-out infinite alternate;
}

@keyframes nebulaDrift1 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(40px, 60px) scale(1.05); }
}

@keyframes nebulaDrift2 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(-50px, -40px) scale(1.08); }
}

@keyframes nebulaDrift3 {
  from { transform: translate(0, 0) scale(1); }
  to   { transform: translate(30px, -50px) scale(0.95); }
}

/* ── Streaming & thinking UX ── */
@keyframes thinking-float {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50%       { transform: translateY(-4px); opacity: 1; }
}

.thinking-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  background: var(--accent);
  border-radius: 9999px;
  animation: thinking-float 1.4s ease-in-out infinite;
}
.thinking-dot:nth-child(2) { animation-delay: 0.2s; }
.thinking-dot:nth-child(3) { animation-delay: 0.4s; }

.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1.1em;
  background: var(--accent);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: blink 0.8s step-end infinite;
  border-radius: 1px;
}

@keyframes blink {
  50% { opacity: 0; }
}

.message-enter {
  animation: messagePop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}

@keyframes messagePop {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

.assistant-bubble {
  position: relative;
}

/* ── Message action bar (dark glass) ── */
.message-actions {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s ease, transform 0.15s ease;
  transform: translateY(-3px);
}

.group:hover .message-actions,
.group:focus-within .message-actions,
.message-actions--visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.message-actions--visible {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.message-actions button {
  min-width: 28px;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.message-actions button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.action-core {
  opacity: 0.8;
}
.action-core:hover {
  opacity: 1;
}

.action-sensitive {
  opacity: 0.6;
}
.action-sensitive:hover {
  opacity: 1;
}
```

- [ ] **Step 2: Verify the file was written correctly**

Run: `head -5 app/globals.css`
Expected output starts with: `@import "tailwindcss";`

---

### Task 2: Update layout.tsx — swap font to Inter, update metadata

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: nothing from prior tasks (standalone)
- Produces: `--font-inter` CSS variable consumed by `globals.css` `@theme inline` block

- [ ] **Step 1: Replace layout.tsx**

Write the following complete content to `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Void",
  description: "Ask the darkness.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify**

Run: `grep -n "The Void" app/layout.tsx`
Expected: line with `title: "The Void"`

---

### Task 3: Update card.tsx — dark glass surface

**Files:**
- Modify: `components/ui/card.tsx`

**Interfaces:**
- Consumes: CSS vars `--glass`, `--glass-border`, `--heading`, `--foreground` from Task 1
- Produces: `Card` component with dark glassmorphism styling

- [ ] **Step 1: Replace card.tsx**

Write the following complete content to `components/ui/card.tsx`:

```tsx
import { cn } from "@/lib/utils";

type CardProps = React.ComponentProps<"div">;

/** Dark glass surface for The Void. */
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border p-4 shadow-sm backdrop-blur-2xl",
        className,
      )}
      style={{
        background: "var(--glass)",
        borderColor: "var(--glass-border)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 60px rgba(167,139,250,0.05)",
      }}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn("mb-2 flex flex-col gap-1", className)} {...props} />;
}

export function CardTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("text-lg font-light tracking-widest uppercase text-foreground", className)}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-muted", className)} {...props} />;
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn("text-foreground", className)} {...props} />;
}
```

- [ ] **Step 2: Verify**

Run: `grep -n "rounded-\[20px\]" components/ui/card.tsx`
Expected: line 13 contains `rounded-[20px]`

---

### Task 4: Update button.tsx — violet accent for dark theme

**Files:**
- Modify: `components/ui/button.tsx`

**Interfaces:**
- Consumes: CSS vars `--accent`, `--accent-glow`, `--glass`, `--glass-border` from Task 1
- Produces: updated `Button` and `ButtonLink` with violet primary, dark secondary, dark ghost variants

- [ ] **Step 1: Replace button.tsx**

Write the following complete content to `components/ui/button.tsx`:

```tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40 disabled:cursor-not-allowed";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "text-white hover:brightness-110 active:scale-95",
  secondary:
    "text-foreground border hover:brightness-125",
  ghost:
    "text-muted hover:text-foreground",
  danger:
    "text-red-400 hover:text-red-300 hover:bg-red-900/20",
};

const variantInlineStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
    boxShadow: "0 0 0 0 var(--accent-glow)",
  },
  secondary: {
    background: "var(--glass)",
    borderColor: "var(--glass-border)",
  },
  ghost: {},
  danger: {},
};

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ ...variantInlineStyles[variant], ...style }}
      {...props}
    />
  );
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
};

export function ButtonLink({
  className,
  variant = "primary",
  style,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(baseStyles, variantStyles[variant], className)}
      style={{ ...variantInlineStyles[variant], ...style }}
      {...props}
    />
  );
}
```

- [ ] **Step 2: Verify**

Run: `grep -n "accent-glow" components/ui/button.tsx`
Expected: line containing `var(--accent-glow)`

---

### Task 5: Update page.tsx — full rebrand of the chat UI

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: all CSS vars and classes from Tasks 1–4
- Produces: fully rebranded UI

**Changes summary:**
1. Import `Trash2` icon (already imported), remove `Sparkles`
2. localStorage key: `the-void-messages`
3. Welcome message: `"You've reached The Void. Ask anything — I'm listening."`
4. Header: event-horizon icon (CSS circle with violet glow) + "The Void" title + clear button (trash icon, top-right)
5. Remove bottom "Clear conversation" link
6. Message list background: transparent
7. User bubbles: violet-tinted glass
8. Assistant bubbles: subtle dark glass
9. Message action bar: dark glass (bg `rgba(10,10,20,0.85)`, border `rgba(255,255,255,0.1)`)
10. Input: dark glass textarea, violet focus ring, placeholder "Send a message into the void..."
11. Add nebula blob divs to page background (outside the card)
12. Thinking text: remove "Thinking" label, just dots
13. Error banner: dark red-glass style

- [ ] **Step 1: Replace page.tsx entirely**

Write the following complete content to `app/page.tsx`:

```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SendHorizonal,
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

const STORAGE_KEY = "the-void-messages";

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "You've reached The Void. Ask anything — I'm listening.",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [WELCOME_MESSAGE];
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [showActionsId, setShowActionsId] = useState<string | null>(null);

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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  function getHistoryForRequest(): ChatMessage[] {
    return messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-12)
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  }

  const placeholder = useMemo(() => {
    return isSending ? "Waiting for the void..." : "Send a message into the void...";
  }, [isSending]);

  function adjustTextareaHeight() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const max = 160;
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

  function cancelCurrent() {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsSending(false);
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }

  function deleteMessage(id: string) {
    setShowActionsId(null);
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
      persist(next);
      return next;
    });
  }

  function editAndResend(id: string) {
    setShowActionsId(null);
    const msg = messages.find((m) => m.id === id);
    if (!msg || msg.role !== "user") return;
    const idx = messages.findIndex((m) => m.id === id);
    const base = messages.slice(0, idx);
    setMessages(base);
    persist(base);
    setInput(msg.content);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      adjustTextareaHeight();
    });
  }

  function regenerateLast() {
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;
    const realIdx = messages.length - 1 - lastUserIdx;
    const userMsg = messages[realIdx];
    const base = messages.slice(0, realIdx + 1);
    setMessages(base);
    persist(base);
    void sendMessage(userMsg.content, true);
  }

  function clearConversation() {
    setMessages([WELCOME_MESSAGE]);
    persist([WELCOME_MESSAGE]);
    setError(null);
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
    <div className="relative flex min-h-screen items-center justify-center p-4" style={{ background: "var(--background)" }}>
      {/* Nebula background blobs */}
      <div className="nebula-blob nebula-blob-1" aria-hidden />
      <div className="nebula-blob nebula-blob-2" aria-hidden />
      <div className="nebula-blob nebula-blob-3" aria-hidden />

      <div className="relative z-10 w-full max-w-[680px]">
        <Card className="p-4 sm:p-6">
          {/* Header */}
          <CardHeader className="flex-row items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              {/* Event-horizon icon */}
              <div
                className="size-9 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "radial-gradient(circle at 40% 40%, rgba(167,139,250,0.3), rgba(124,58,237,0.1) 60%, transparent 100%)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  boxShadow: "0 0 16px rgba(167,139,250,0.25), inset 0 0 8px rgba(0,0,0,0.5)",
                }}
                aria-hidden
              >
                <div
                  className="size-3 rounded-full"
                  style={{
                    background: "radial-gradient(circle, #a78bfa 0%, #4c1d95 60%, #0a0008 100%)",
                    boxShadow: "0 0 8px rgba(167,139,250,0.6)",
                  }}
                />
              </div>
              <CardTitle>The Void</CardTitle>
            </div>

            {/* Clear conversation */}
            <button
              type="button"
              onClick={clearConversation}
              className="rounded-lg p-2 transition-colors"
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
            className="mb-4 h-px w-full"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(167,139,250,0.4) 50%, transparent)",
            }}
            aria-hidden
          />

          <CardContent className="space-y-4">
            {error ? (
              <div
                className="flex items-start gap-2 rounded-xl p-3 text-sm"
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
                    const lastUser = [...messages]
                      .reverse()
                      .find((m) => m.role === "user");
                    setError(null);
                    if (lastUser) {
                      void sendMessage(lastUser.content);
                    }
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
              className="max-h-[60vh] space-y-3 overflow-y-auto overflow-x-hidden rounded-xl p-3 sm:p-4"
              aria-label="Messages"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(167,139,250,0.2) transparent",
              }}
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
                      setShowActionsId((prev) => (prev === m.id ? null : m.id));
                    }}
                  >
                    <div
                      className={cn(
                        "relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 assistant-bubble",
                      )}
                      style={
                        m.role === "user"
                          ? {
                              background: "rgba(167,139,250,0.12)",
                              border: "1px solid rgba(167,139,250,0.25)",
                              color: "var(--foreground)",
                            }
                          : {
                              background: "rgba(255,255,255,0.04)",
                              border: "1px solid rgba(255,255,255,0.06)",
                              color: "var(--foreground)",
                            }
                      }
                      onClick={(e) => {
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
                        <span className="inline-flex items-center gap-1.5" style={{ color: "var(--accent)" }}>
                          <span className="thinking-dot" />
                          <span className="thinking-dot" />
                          <span className="thinking-dot" />
                        </span>
                      ) : null}

                      {showActions && m.status !== "streaming" && (
                        <div
                          className={cn(
                            "message-actions absolute -top-2 z-20 flex gap-1 rounded-lg p-0.5",
                            m.role === "user" ? "left-2" : "right-2",
                            showActionsId === m.id && "message-actions--visible",
                          )}
                          style={{
                            background: "rgba(10,10,20,0.85)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            backdropFilter: "blur(12px)",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => copyToClipboard(m.content)}
                            className="rounded p-1 action-core transition-colors"
                            style={{ color: "rgba(226,232,240,0.7)" }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "var(--accent)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = "rgba(226,232,240,0.7)")
                            }
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
                              className="rounded p-1 action-core transition-colors disabled:opacity-30"
                              style={{ color: "rgba(226,232,240,0.7)" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color = "var(--accent)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = "rgba(226,232,240,0.7)")
                              }
                              aria-label="Regenerate response"
                              title="Regenerate"
                            >
                              <RotateCcw className="size-3.5" />
                            </button>
                          )}

                          {m.role === "user" && (
                            <button
                              type="button"
                              onClick={() => editAndResend(m.id)}
                              disabled={isSending}
                              className="rounded p-1 action-sensitive transition-colors disabled:opacity-30"
                              style={{ color: "rgba(226,232,240,0.6)" }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.color = "var(--accent)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.color = "rgba(226,232,240,0.6)")
                              }
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
                            className="rounded p-1 action-sensitive transition-colors disabled:opacity-30"
                            style={{ color: "rgba(226,232,240,0.6)" }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "#f87171")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color = "rgba(226,232,240,0.6)")
                            }
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

            {/* Input area */}
            <form
              className="flex items-end gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (canSend) void sendMessage();
              }}
            >
              <label className="flex-1 text-sm font-medium">
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
                  className="w-full min-h-[44px] resize-none overflow-y-auto rounded-xl px-3 py-2.5 text-sm transition-all focus:outline-none disabled:opacity-40"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "var(--foreground)",
                    caretColor: "var(--accent)",
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
                  className="h-11 px-4"
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run from `frontend/` directory:
```bash
npx tsc --noEmit
```
Expected: no errors (or only pre-existing errors unrelated to our changes)

- [ ] **Step 3: Commit all changes**

```bash
git add app/globals.css app/layout.tsx app/page.tsx components/ui/card.tsx components/ui/button.tsx docs/
git commit -m "feat: rebrand to The Void — deep space glassmorphism UI"
```

---

## Self-Review Checklist

- [x] All 5 files covered: globals.css, layout.tsx, page.tsx, card.tsx, button.tsx
- [x] localStorage key changed to `the-void-messages`
- [x] Welcome message updated
- [x] Nebula blobs in page.tsx, keyframes in globals.css
- [x] `--font-inter` variable set in layout.tsx, consumed in globals.css `@theme inline`
- [x] No new npm packages
- [x] Chat logic (streaming, abort, edit, regenerate, delete) unchanged
- [x] No placeholders or TBDs
