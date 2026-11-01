import { NextRequest, NextResponse } from "next/server";
import { DataSourcesRepo } from "@/lib/server/repositories/datasources";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = DataSourcesRepo.getAll();
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
