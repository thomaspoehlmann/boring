# AI Coach

A single-page chat app for the AI Engineer Challenge.

Next.js frontend that talks to the FastAPI backend via a thin proxy.

## One page

- The entire UI is the chat (no dashboard, no settings).
- Root (`/`) is the chat.

## Run locally

From the project **root**, start the FastAPI backend:

```bash
export OPENAI_API_KEY=sk-your-key-here
# Optional: override model (defaults to gpt-5)
# export OPENAI_MODEL=gpt-4o-mini

uv sync
uv run uvicorn api.index:app --reload
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — the chat is ready.

## Project structure

```
app/
  page.tsx                 # The single chat page
  layout.tsx
  api/chat/route.ts        # Thin proxy to FastAPI
components/
  ui/
    button.tsx
    card.tsx
lib/
  utils.ts
types/
  chat.ts
```

## Environment variables (frontend)

- `API_BASE_URL` (server-only, preferred) or `NEXT_PUBLIC_API_URL`
- Falls back to `http://localhost:8000`

## Build

```bash
cd frontend
npm run build
npm start
```

## Deployment

- Frontend deployed as its own Vercel project (Next.js).
- Backend (`api/`) deployed as a separate Vercel Python project using `@vercel/python`.
- Import the `frontend/` folder directly (or set Root Directory = `frontend`).
- Set `API_BASE_URL` (or `NEXT_PUBLIC_API_URL`) on the frontend project to point at your deployed API.

The chat is the only page. Everything else was removed.
