import { NextRequest, NextResponse } from "next/server";
import { BudgetsRepo } from "@/lib/server/repositories/budgets";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = BudgetsRepo.getAll();
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.k || !body.budget) {
      return NextResponse.json({ success: false, error: "Missing required fields (k, budget)" }, { status: 400 });
    }

    const created = BudgetsRepo.create({
      k: body.k,
      budget: Number(body.budget),
      owner: body.owner || "Unassigned",
      alert: body.alert || "90% of budget",
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
