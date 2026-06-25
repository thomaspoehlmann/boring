# AI Engineer Challenge

Building your first LLM application with OpenAI + AI-assisted development (Next.js frontend + FastAPI backend).

This is a two-project setup:
- `api/` — FastAPI backend (deployed separately on Vercel with `@vercel/python`)
- `frontend/` — Next.js dashboard (separate Vercel project)

---

## Prerequisites

- Git, a code editor (Cursor / VS Code), terminal
- Python via `uv` (`pip install uv`)
- Node.js + npm (for the Next.js frontend)
- An OpenAI API key

---

## Backend (FastAPI)

From the project root:

```bash
export OPENAI_API_KEY=sk-your-key-here
# Optional: override the model (defaults to gpt-5 per challenge request)
# export OPENAI_MODEL=gpt-4o-mini

uv sync
uv run uvicorn api.index:app --reload
```

The API will be available at `http://localhost:8000`.

Key endpoints:
- `POST /api/chat` — `{ "message": "..." }` → `{ "reply": "..." }`
- `GET /api/health`

Model is configurable via `OPENAI_MODEL` env var (defaults to `"gpt-5"`).

---

## Frontend (Next.js)

In another terminal:

```bash
cd frontend
npm install

# Optional: tell the proxy where the backend lives (local dev)
# echo 'API_BASE_URL=http://localhost:8000' > .env.local

npm run dev
```

Open http://localhost:3000 — redirects to the dashboard.

---

## Local development flow (two terminals)

1. `uv run uvicorn api.index:app --reload` (port 8000)
2. `cd frontend && npm run dev` (port 3000)

The frontend proxy (`/app/api/chat/route.ts`) forwards chat messages to the FastAPI backend.

---

## Deployment (Vercel) — Two separate projects

### 1. Deploy the API (Python)

- In Vercel, import the `api/` folder as its own project (or set the root directory to `api`).
- It uses `api/vercel.json` + `api/requirements.txt` + `@vercel/python`.
- Add your `OPENAI_API_KEY` (and optionally `OPENAI_MODEL`) in the Vercel project settings.
- Note the deployed URL (e.g. `https://your-api.vercel.app`).

### 2. Deploy the frontend (Next.js)

- Import the `frontend/` folder as its own Vercel project (recommended), or import the repo and set **Root Directory** to `frontend`.
- The frontend is a standard Next.js project (it contains its own `vercel.json`).
- Set the environment variable on the **frontend** project:
  - `API_BASE_URL=https://your-api.vercel.app` (server-only, preferred)
- Deploy.

Users visit the frontend URL. The Next.js proxy calls the API project.

---

## Vibe Check

Complete the activities below directly in this README after you have a working deployed app.

### Activity #1: General Capability Vibe Check

**1. Prompt:**  
Explain the concept of object-oriented programming in simple terms to a complete beginner.  
**Aspect Tested:**

**Response:**

---

**2. Prompt:**  
Read the following paragraph and provide a concise summary of the key points…  
**Aspect Tested:**

**Response:**

---

**3. Prompt:**  
Write a short, imaginative story (100–150 words) about a robot finding friendship in an unexpected place.  
**Aspect Tested:**

**Response:**

---

**4. Prompt:**  
If a store sells apples in packs of 4 and oranges in packs of 3, how many packs of each do I need to buy to get exactly 12 apples and 9 oranges?  
**Aspect Tested:**

**Response:**

---

**5. Prompt:**  
Rewrite the following paragraph in a professional, formal tone…  
**Aspect Tested:**

**Response:**

---

**Question #1**  
Do the answers appear to be correct and useful?

**Your Answer:**

---

### Activity #2: Personal Use Vibe Check

**Prompt:**

**Result:**

**Prompt:**

**Result:**

**Prompt:**

**Result:**

**Question #2**  
Are the vibes of your assistant aligned with your expectations? Why or why not?

**Your Answer:**

---

### Activity #3: Capability Gaps Vibe Check

**Prompt:**

**Result:**

**Prompt:**

**Result:**

**Question #3**  
What are some limitations of your application?

**Your Answer:**

---

## (Optional) Improve Your App

**Adjustments Made:**

**Results:**

---

## Submission

1. Complete the vibe check sections above.
2. Commit and push.
3. Share your repo link + the **frontend** Vercel domain (not the API URL).

---

## Credits

Based on the [AI Engineer Challenge](https://github.com/AI-Maker-Space/The-AI-Engineer-Challenge) by AI Makerspace.
