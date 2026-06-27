# The Void — Design Spec

**Date:** 2026-06-27  
**Status:** Approved

---

## Overview

Rebrand the existing "AI Coach" chat application as **"The Void"** — a deep-space glassmorphism chatbot. The core chat functionality (streaming, message actions, persistence, error handling) remains unchanged. Only the visual layer and branding are being replaced.

**Tagline:** *"Ask the darkness."*

---

## Color Palette

| CSS Variable | Value | Use |
|---|---|---|
| `--background` | `#050508` | Page background — near-black |
| `--nebula-1` | `#1a0533` | Deep indigo gradient blob |
| `--nebula-2` | `#0d1a3e` | Deep blue gradient blob |
| `--nebula-3` | `#2d0a4e` | Purple gradient blob |
| `--glass` | `rgba(255,255,255,0.04)` | Glass panel fill |
| `--glass-border` | `rgba(255,255,255,0.08)` | Glass panel border |
| `--accent` | `#a78bfa` | Violet/lavender — primary accent |
| `--accent-glow` | `rgba(167,139,250,0.3)` | Glow effects |
| `--foreground` | `#e2e8f0` | Body text |
| `--text-muted` | `rgba(226,232,240,0.4)` | Subdued text |
| `--primary` | `#1e293b` | Kept for compatibility |

---

## Background — Nebula Effect

Three large blurred gradient blobs (CSS radial gradients) absolutely positioned in the page background:
- Top-left: `--nebula-1` (deep indigo)
- Bottom-right: `--nebula-2` (deep blue)  
- Center-right: `--nebula-3` (purple)

Each blob: ~600–800px circle, `filter: blur(120px)`, `opacity: 0.6`, `pointer-events: none`, `z-index: 0`.

All three drift slowly via a CSS keyframe animation (`nebulaDrift`, 20s, ease-in-out, infinite, alternate). Each blob uses a different `animation-delay` so they move independently.

---

## Font

Replace Geist with **Inter** from Google Fonts. Inter is clean, highly readable at small sizes, and works well in a dark premium context.

---

## Layout

- Full-viewport page, `z-index: 1` relative to nebula background
- Chat panel: centered, `max-width: 680px`, full viewport height on mobile
- The panel itself is a glass surface: `background: var(--glass)`, `backdrop-filter: blur(24px)`, `border: 1px solid var(--glass-border)`, `border-radius: 20px`
- Subtle top-edge inner glow: `box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 0 60px rgba(167,139,250,0.05)`

---

## Header

- Left: event-horizon icon (a circle with a violet radial glow, rendered via CSS — no image file needed) + "The Void" in light-weight Inter, letter-spaced
- Right: small icon button (trash icon) to clear conversation — replaces the "Clear conversation" text link at the bottom
- Thin divider below header with a violet glow centered on it (CSS `background: linear-gradient(to right, transparent, var(--accent), transparent)`)

---

## Message Bubbles

| Element | Style |
|---|---|
| **User bubble** | `background: rgba(167,139,250,0.12)`, `border: 1px solid rgba(167,139,250,0.25)`, right-aligned, white text |
| **Assistant bubble** | `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.06)`, left-aligned, `color: var(--foreground)` |
| **Message list background** | Transparent (no `bg-slate-50` — the nebula shows through) |
| **Streaming cursor** | Pulsing violet block `▋`, color `var(--accent)` |
| **Thinking dots** | Drift animation instead of bounce — gentle horizontal float |

---

## Message Action Bar

- Background: `rgba(10,10,20,0.8)` (dark glass, not white)
- Border: `1px solid rgba(255,255,255,0.1)`
- Buttons: text `rgba(226,232,240,0.7)`, hover text `var(--accent)`
- Delete hover: soft red tint

---

## Input Area

- Glass textarea: `background: rgba(255,255,255,0.04)`, `border: 1px solid rgba(255,255,255,0.08)`, white text
- Focus ring: violet (`var(--accent)`)
- Placeholder: *"Send a message into the void..."*
- Send button: violet gradient (`background: linear-gradient(135deg, #a78bfa, #7c3aed)`), glow on hover via `box-shadow: 0 0 20px var(--accent-glow)`
- Stop button: dim red-glass style

---

## Welcome Message

New copy: *"You've reached The Void. Ask anything — I'm listening."*

---

## localStorage Key

Change from `ai-coach-messages` to `the-void-messages` to avoid stale data from the old branding.

---

## Files Modified

| File | Change |
|---|---|
| `app/globals.css` | Full replacement — new color tokens, nebula animation, dark glass styles |
| `app/layout.tsx` | Update title/description metadata, swap font to Inter |
| `app/page.tsx` | Rebrand UI: header, bubbles, input, welcome message, localStorage key, clear button position |
| `components/ui/card.tsx` | Update glass surface for dark theme |
| `components/ui/button.tsx` | Update variant styles for dark theme |

---

## Out of Scope

- No changes to API route (`app/api/chat/route.ts`)
- No changes to types (`types/chat.ts`) or utils (`lib/utils.ts`)
- No new npm packages (Inter loaded via `next/font/google`, already available)
- No functional changes to chat logic
