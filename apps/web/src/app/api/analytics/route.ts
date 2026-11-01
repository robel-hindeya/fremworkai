import { NextResponse } from "next/server";
import { FinancialService } from "@/lib/server/services/analytics";

export const runtime = "nodejs";

export async function GET() {
  try {
    const metrics = FinancialService.getMetrics();
    return NextResponse.json({ success: true, data: metrics });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
