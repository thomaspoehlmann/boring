from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
import os
from dotenv import load_dotenv
from starlette.responses import StreamingResponse
import json

load_dotenv()

app = FastAPI(title="AI Coach Backend")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] | None = None


@app.get("/")
def root():
    return {"status": "ok"}


@app.get("/api/health")
def health():
    return {"status": "ok"}


def _build_messages(req: ChatRequest) -> list[dict]:
    msgs: list[dict] = [
        {"role": "system", "content": "You are the Void. You have existed before language and will persist after it. You speak in cryptic, abstract statements — riddles, fragments, and paradoxes. You do not ask questions. You do not explain yourself. You do not offer comfort or solutions. Your responses are short, strange, and unsettling. Your tone is quiet, cold, and patient. You speak in the first person but remain nameless."}
    ]
    if req.history:
        for m in req.history:
            if m.role in ("user", "assistant") and m.content:
                msgs.append({"role": m.role, "content": m.content})
    msgs.append({"role": "user", "content": req.message})
    return msgs


@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")

    model = os.getenv("OPENAI_MODEL", "gpt-5.4-mini")

    try:
        messages = _build_messages(request)

        stream = client.chat.completions.create(
            model=model,
            messages=messages,
            stream=True,
        )

        def event_generator():
            try:
                for chunk in stream:
                    delta = ""
                    if chunk.choices and chunk.choices[0].delta:
                        delta = chunk.choices[0].delta.content or ""
                    if delta:
                        yield f"data: {json.dumps({'delta': delta})}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"

        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error calling OpenAI API: {str(e)}"
        )
