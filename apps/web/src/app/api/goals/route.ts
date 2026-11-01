import { NextRequest, NextResponse } from "next/server";
import { GoalsRepo } from "@/lib/server/repositories/goals";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = GoalsRepo.getAll();
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.type || !body.target || !body.date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const created = GoalsRepo.create({
      name: body.name,
      type: body.type,
      cur: Number(body.cur || 0),
      target: Number(body.target),
      start: body.start !== undefined ? Number(body.start) : undefined,
      date: body.date,
      down: Boolean(body.down),
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
