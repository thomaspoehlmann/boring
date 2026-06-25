import { NextResponse } from "next/server";
import type { ChatRequest, ChatResponse, ChatMessage } from "@/types/chat";

function getBackendBaseUrl() {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000"
  );
}

export async function POST(request: Request) {
  let body: ChatRequest | null = null;

  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body?.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const backendBaseUrl = getBackendBaseUrl().replace(/\/+$/, "");
  const url = `${backendBaseUrl}/api/chat`;

  const history: ChatMessage[] = Array.isArray(body.history)
    ? body.history
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && m.content)
        .map((m) => ({ role: m.role, content: m.content }))
    : [];

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message, history }),
      cache: "no-store",
    });

    if (!res.ok) {
      const maybeJson = await res.json().catch(() => null);
      const detail =
        (maybeJson && typeof maybeJson.detail === "string" && maybeJson.detail) ||
        (maybeJson && typeof maybeJson.error === "string" && maybeJson.error) ||
        `Backend error (${res.status})`;
      return NextResponse.json({ error: detail }, { status: res.status });
    }

    // Streaming path
    if (res.headers.get("content-type")?.includes("text/event-stream")) {
      const reader = res.body?.getReader();
      if (!reader) {
        return NextResponse.json(
          { error: "Empty stream from backend" },
          { status: 502 },
        );
      }

      const stream = new ReadableStream({
        async start(controller) {
          const decoder = new TextDecoder();
          let buffer = "";
          try {
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
                  controller.close();
                  return;
                }
                if (trimmed.startsWith("data: ")) {
                  const jsonStr = trimmed.slice(6);
                  try {
                    const payload = JSON.parse(jsonStr);
                    if (payload.delta) {
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify({ delta: payload.delta })}\n\n`,
                        ),
                      );
                    }
                    if (payload.error) {
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify({ error: payload.error })}\n\n`,
                        ),
                      );
                      controller.close();
                      return;
                    }
                  } catch {
                    // ignore partial json
                  }
                }
              }
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // Fallback non-streaming
    const data = (await res.json()) as ChatResponse;
    if (!data?.reply || typeof data.reply !== "string") {
      return NextResponse.json(
        { error: "Malformed backend response" },
        { status: 502 },
      );
    }
    return NextResponse.json({ reply: data.reply } satisfies ChatResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reach backend";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
