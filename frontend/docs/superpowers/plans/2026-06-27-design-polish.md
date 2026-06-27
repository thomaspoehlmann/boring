# Design Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish "The Void" dark glassmorphism chat UI with 6 targeted improvements: scroll-to-bottom button, better empty state, input separator + disabled send state, message timestamps, thinking dots glow, send button hover animation.

**Architecture:** All changes are confined to `app/page.tsx` and `app/globals.css`. No new packages. No API or logic changes.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5, Tailwind CSS v4, lucide-react, CSS custom properties

## Global Constraints

- Do NOT modify `app/api/chat/route.ts`, `types/chat.ts`, `lib/utils.ts`
- Do NOT install new npm packages
- All colors use existing CSS custom properties: `--accent: #a78bfa`, `--accent-glow: rgba(167,139,250,0.3)`, `--glass: rgba(255,255,255,0.04)`, `--glass-border: rgba(255,255,255,0.08)`, `--foreground: #e2e8f0`, `--muted: rgba(226,232,240,0.4)`, `--background: #050508`
- TypeScript must compile clean: `npx tsc --noEmit`
- No emojis in UI copy
- Commit with: `git -c commit.gpgsign=false commit`

---

### Task 1: Scroll-to-bottom button

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `listRef` (ref to message list div), existing scroll logic
- Produces: A floating violet button that appears when user is not at the bottom of the message list, clicking it scrolls to bottom

- [ ] **Step 1: Add `isAtBottom` state and scroll listener**

Add to `ChatPage` state:
```tsx
const [isAtBottom, setIsAtBottom] = useState(true);
```

Add a `useEffect` that attaches a `scroll` listener to `listRef`:
```tsx
useEffect(() => {
  const el = listRef.current;
  if (!el) return;
  const onScroll = () => {
    const threshold = 60;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
  };
  el.addEventListener("scroll", onScroll, { passive: true });
  return () => el.removeEventListener("scroll", onScroll);
}, []);
```

- [ ] **Step 2: Add the scroll-to-bottom button JSX**

Inside the `CardContent`, after the message list `</div>` closing tag and before the `{/* Input area */}` comment, add:

```tsx
{/* Scroll-to-bottom button */}
{!isAtBottom && (
  <div className="flex justify-center">
    <button
      type="button"
      onClick={() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })}
      className="scroll-to-bottom-btn"
      aria-label="Scroll to bottom"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Latest
    </button>
  </div>
)}
```

- [ ] **Step 3: Add CSS for scroll-to-bottom button**

Append to `app/globals.css`:
```css
/* ── Scroll-to-bottom button ── */
.scroll-to-bottom-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  color: var(--accent);
  background: rgba(167, 139, 250, 0.08);
  border: 1px solid rgba(167, 139, 250, 0.2);
  transition: background 0.15s ease, box-shadow 0.15s ease;
}
.scroll-to-bottom-btn:hover {
  background: rgba(167, 139, 250, 0.15);
  box-shadow: 0 0 12px rgba(167, 139, 250, 0.2);
}
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git -c commit.gpgsign=false commit -am "feat: add scroll-to-bottom button"
```

---

### Task 2: Empty state / first impression

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `WELCOME_MESSAGE` (id: `"welcome"`), message list render loop
- Produces: When only the welcome message is shown (single message with id `"welcome"`), render a centered empty state instead of a bubble: large event-horizon icon, tagline, then the welcome text. For all subsequent messages, render normally.

- [ ] **Step 1: Add empty state rendering**

Inside the message list map, before the `return (` for the first message, add a check. Replace the message list contents with:

```tsx
{messages.length === 1 && messages[0].id === "welcome" ? (
  <div className="flex flex-col items-center justify-center py-10 gap-4 text-center select-none">
    {/* Large event-horizon icon */}
    <div
      className="size-16 rounded-full flex items-center justify-center"
      style={{
        background: "radial-gradient(circle at 40% 40%, rgba(167,139,250,0.25), rgba(124,58,237,0.08) 60%, transparent 100%)",
        border: "1px solid rgba(167,139,250,0.25)",
        boxShadow: "0 0 40px rgba(167,139,250,0.15), inset 0 0 16px rgba(0,0,0,0.6)",
      }}
    >
      <div
        className="size-6 rounded-full"
        style={{
          background: "radial-gradient(circle, #a78bfa 0%, #4c1d95 60%, #0a0008 100%)",
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
    // ... existing map contents unchanged
  })
)}
```

The existing `messages.map(...)` block becomes the else branch of this ternary. Keep every line of the existing map body exactly as-is.

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git -c commit.gpgsign=false commit -am "feat: add empty state with event-horizon icon and tagline"
```

---

### Task 3: Input area separator + disabled send button state

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing `Button` component, `canSend` boolean
- Produces:
  - A thin violet gradient divider line between the message list and the input form
  - When send button is disabled (`!canSend`), its gradient desaturates to a dim grey-glass look instead of just `opacity-40`

- [ ] **Step 1: Add separator between message list and input form**

In `app/page.tsx`, between the scroll-to-bottom button block (or message list closing div) and the `{/* Input area */}` form, add:

```tsx
{/* Input separator */}
<div
  className="h-px w-full"
  style={{
    background: "linear-gradient(to right, transparent, rgba(167,139,250,0.15) 50%, transparent)",
  }}
  aria-hidden
/>
```

- [ ] **Step 2: Update disabled send button styling**

In `app/page.tsx`, find the send `Button` and add a `style` prop that reflects disabled state:

```tsx
<Button
  type="submit"
  variant="primary"
  disabled={!canSend}
  className="h-11 px-4"
  aria-label="Send message"
  style={!canSend ? {
    background: "rgba(255,255,255,0.06)",
    boxShadow: "none",
  } : undefined}
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
```

- [ ] **Step 3: Remove `disabled:opacity-40` from Button base styles**

In `components/ui/button.tsx`, the `baseStyles` string contains `disabled:opacity-40`. Remove it — the disabled state is now handled via the inline style override on the send button specifically.

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git -c commit.gpgsign=false commit -am "feat: add input separator, improve disabled send button appearance"
```

---

### Task 4: Message timestamps on hover

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `Message` type (has `id` which encodes timestamp via `makeId()`: `${Date.now()}-${...}`), message render loop
- Produces: A relative timestamp shown below each bubble on hover (e.g. "just now", "2m ago", "1h ago"). The timestamp fades in with the same transition as the action bar.

- [ ] **Step 1: Add timestamp extraction and formatting utility**

Add this function to `app/page.tsx` (outside the component, after `makeId`):

```tsx
function formatRelativeTime(id: string): string {
  if (id === "welcome") return "";
  const ts = parseInt(id.split("-")[0], 10);
  if (isNaN(ts)) return "";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
```

- [ ] **Step 2: Add timestamp element below each bubble**

Inside the message render loop, after the closing `</div>` of the bubble div (the one with `className={cn("group relative max-w-[85%] ...")}`) but still inside the outer row `<div>`, add a wrapper that shows the timestamp:

Actually — place the timestamp **inside** the bubble div, after the action bar block, as a separate absolutely-positioned element:

```tsx
{/* Timestamp */}
{m.id !== "welcome" && (
  <span className="message-timestamp">
    {formatRelativeTime(m.id)}
  </span>
)}
```

Place this after the closing `</div>` of the action bar conditional block, still inside the bubble `<div>`.

- [ ] **Step 3: Add CSS for timestamp**

Append to `app/globals.css`:
```css
/* ── Message timestamps ── */
.message-timestamp {
  display: block;
  font-size: 10px;
  margin-top: 4px;
  color: var(--muted);
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
  user-select: none;
}
.group:hover .message-timestamp {
  opacity: 1;
}
```

- [ ] **Step 4: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git -c commit.gpgsign=false commit -am "feat: add relative timestamps on message hover"
```

---

### Task 5: Thinking dots glow refinement

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `.thinking-dot` class, `@keyframes thinking-float`
- Produces: Each dot has a soft violet `box-shadow` glow that pulses in sync with its float animation, making the thinking state feel more alive

- [ ] **Step 1: Update thinking dot CSS**

In `app/globals.css`, replace the existing `.thinking-dot` rule:

```css
.thinking-dot {
  display: inline-block;
  width: 5px;
  height: 5px;
  background: var(--accent);
  border-radius: 9999px;
  animation: thinking-float 1.4s ease-in-out infinite;
}
```

With:

```css
.thinking-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: var(--accent);
  border-radius: 9999px;
  animation: thinking-glow 1.4s ease-in-out infinite;
  box-shadow: 0 0 6px var(--accent-glow);
}
```

And replace `@keyframes thinking-float` with:

```css
@keyframes thinking-glow {
  0%, 100% {
    transform: translateY(0);
    opacity: 0.4;
    box-shadow: 0 0 4px var(--accent-glow);
  }
  50% {
    transform: translateY(-5px);
    opacity: 1;
    box-shadow: 0 0 12px var(--accent-glow), 0 0 20px rgba(167, 139, 250, 0.2);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git -c commit.gpgsign=false commit -am "feat: thinking dots glow animation"
```

---

### Task 6: Send button icon slide animation on hover

**Files:**
- Modify: `app/globals.css`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `Button` component with `variant="primary"`, `SendHorizonal` icon
- Produces: On hover over the enabled send button, the `SendHorizonal` icon slides 3px to the right and back, reinforcing the "sending into the void" metaphor. Achieved via a CSS class on the button that animates its `svg` child.

- [ ] **Step 1: Add CSS for send button icon animation**

Append to `app/globals.css`:
```css
/* ── Send button icon slide ── */
.send-btn svg {
  transition: transform 0.2s ease;
}
.send-btn:not(:disabled):hover svg {
  transform: translateX(3px);
}
```

- [ ] **Step 2: Add `send-btn` class to the send button**

In `app/page.tsx`, find the send `Button` and add `send-btn` to its className:

```tsx
<Button
  type="submit"
  variant="primary"
  disabled={!canSend}
  className="h-11 px-4 send-btn"
  ...
>
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git -c commit.gpgsign=false commit -am "feat: send button icon slide animation on hover"
```
