import { NextRequest, NextResponse } from "next/server";
import { ChatRepo } from "@/lib/server/repositories/chat";
import { runFinancialAgent } from "@/lib/server/agent/engine";

export const runtime = "nodejs";

export async function GET() {
  try {
    const list = ChatRepo.getAllConversations();
    return NextResponse.json({ success: true, count: list.length, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, text, files, mode = "Balanced" } = body;

    const q = (text || "").trim() || (files?.length ? "Analyze the attached file." : "");
    if (!q) {
      return NextResponse.json({ success: false, error: "Empty message" }, { status: 400 });
    }

    const cid = conversationId || `c-${Date.now().toString(36)}`;
    const forcedError = /\bfail\b|\berror test\b/i.test(q);
    const limitHit = /usage limit/i.test(q);

    // Save user message to database
    const userMsg = ChatRepo.addMessage(cid, {
      role: "user",
      text: q,
      files: files || [],
      status: "done",
    });

    if (forcedError) {
      const aiMsg = ChatRepo.addMessage(cid, {
        role: "ai",
        kind: "performance",
        mode,
        status: "error",
        files: [],
      });
      return NextResponse.json({ success: true, data: { conversationId: cid, userMessage: userMsg, aiMessage: aiMsg } });
    }

    if (limitHit) {
      const aiMsg = ChatRepo.addMessage(cid, {
        role: "ai",
        kind: "performance",
        mode,
        status: "limit",
        files: [],
      });
      return NextResponse.json({ success: true, data: { conversationId: cid, userMessage: userMsg, aiMessage: aiMsg } });
    }

    // Run Autonomous Financial Agent
    const agentRes = await runFinancialAgent(q, mode);

    // Save AI response message to database
    const aiMsg = ChatRepo.addMessage(cid, {
      role: "ai",
      kind: agentRes.kind,
      mode,
      status: "done",
      text: agentRes.text,
      file_name: files?.[0]?.name,
      files: [],
    });

    const conversation = ChatRepo.getConversation(cid);

    return NextResponse.json({
      success: true,
      data: {
        conversationId: cid,
        userMessage: userMsg,
        aiMessage: {
          ...aiMsg,
          thought: agentRes.thought,
          toolCalls: agentRes.toolCalls,
          actionsTaken: agentRes.actionsTaken,
        },
        conversation,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
