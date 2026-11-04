import { NextRequest } from "next/server";
import { runFinancialAgent } from "@/lib/server/agent/engine";
import { ChatRepo } from "@/lib/server/repositories/chat";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const text = (body.text || "").trim();
  const mode = body.mode || "Balanced";

  if (!text) {
    return new Response(JSON.stringify({ error: "Empty prompt" }), { status: 400 });
  }

  // Save user message to database
  ChatRepo.addMessage(id, {
    role: "user",
    text,
    files: body.files || [],
    status: "done",
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send meta event
        controller.enqueue(
          encoder.encode(`event: meta\ndata: ${JSON.stringify({ mode, status: "streaming" })}\n\n`)
        );

        // Run agent (Gemini tool-calling or deterministic fallback)
        const res = await runFinancialAgent(text, mode);

        // Save AI message to database
        ChatRepo.addMessage(id, {
          role: "ai",
          kind: res.kind,
          mode,
          status: "done",
          text: res.text,
          files: [],
        });

        // Emit text block
        if (res.text) {
          controller.enqueue(
            encoder.encode(`event: block\ndata: ${JSON.stringify({ type: "text", text: res.text })}\n\n`)
          );
        }

        // Emit tool call / calc block if present
        for (const tc of res.toolCalls || []) {
          if (tc.tool === "calculate" && tc.result?.result !== undefined) {
            controller.enqueue(
              encoder.encode(
                `event: block\ndata: ${JSON.stringify({
                  type: "calc",
                  working: tc.args?.expression || "",
                  result: String(tc.result.result),
                })}\n\n`
              )
            );
          }
        }

        // Emit recommendation block if actions or recommendations exist
        if (res.actionsTaken && res.actionsTaken.length > 0) {
          controller.enqueue(
            encoder.encode(
              `event: block\ndata: ${JSON.stringify({
                type: "recommendation",
                items: res.actionsTaken,
              })}\n\n`
            )
          );
        }

        // Send done event
        controller.enqueue(
          encoder.encode(`event: done\ndata: ${JSON.stringify({ tokensIn: 250, tokensOut: 180 })}\n\n`)
        );
      } catch (err: any) {
        controller.enqueue(
          encoder.encode(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`)
        );
      } finally {
        controller.close();
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
