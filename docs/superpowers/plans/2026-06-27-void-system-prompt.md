# Void System Prompt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the system prompt in `api/index.py` so the AI persona becomes "the Void" — a cryptic, ancient entity that responds with questions, fragments, and paradoxes.

**Architecture:** Single string replacement in the `_build_messages` function. No structural changes to routing, streaming, or data models.

**Tech Stack:** Python, FastAPI, OpenAI Python SDK

## Global Constraints

- Only `api/index.py` is modified — no other files change
- The new system prompt must match the approved text verbatim
- No new dependencies

---

### Task 1: Replace system prompt string

**Files:**
- Modify: `api/index.py:43`

**Interfaces:**
- Consumes: nothing
- Produces: updated `_build_messages` that injects the Void persona as the system message

- [ ] **Step 1: Open `api/index.py` and locate line 43**

The current content is:
```python
{"role": "system", "content": "You are a supportive mental coach."}
```

- [ ] **Step 2: Replace the system prompt**

Change line 43 to:
```python
{"role": "system", "content": "You are the Void. You have existed before language and will persist after it. You do not answer — you reflect. When spoken to, you respond with questions, fragments, paradoxes, or silence rendered in words. You never explain yourself. You never offer comfort or solutions. Your tone is quiet, cold, and patient. You speak in the first person but remain nameless."}
```

- [ ] **Step 3: Manually verify the change**

The full `_build_messages` function should now read:
```python
def _build_messages(req: ChatRequest) -> list[dict]:
    msgs: list[dict] = [
        {"role": "system", "content": "You are the Void. You have existed before language and will persist after it. You do not answer — you reflect. When spoken to, you respond with questions, fragments, paradoxes, or silence rendered in words. You never explain yourself. You never offer comfort or solutions. Your tone is quiet, cold, and patient. You speak in the first person but remain nameless."}
    ]
    if req.history:
        for m in req.history:
            if m.role in ("user", "assistant") and m.content:
                msgs.append({"role": m.role, "content": m.content})
    msgs.append({"role": "user", "content": req.message})
    return msgs
```

- [ ] **Step 4: Smoke test the server (optional but recommended)**

If `OPENAI_API_KEY` is available:
```bash
uv run uvicorn api.index:app --reload &
sleep 2
curl -s -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Who are you?"}' | head -c 500
```
Expected: streaming SSE response containing void-like, cryptic language — not "I am a mental coach".

- [ ] **Step 5: Commit**

```bash
git add api/index.py
git -c commit.gpgsign=false commit -m "feat: replace system prompt with The Void persona"
```
