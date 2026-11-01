import { NextRequest, NextResponse } from "next/server";
import { ProjectsRepo } from "@/lib/server/repositories/projects";

export const runtime = "nodejs";

export async function GET() {
  try {
    const data = ProjectsRepo.getAll();
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.desc) {
      return NextResponse.json({ success: false, error: "Missing required fields (name, desc)" }, { status: 400 });
    }

    const created = ProjectsRepo.create({
      name: body.name,
      desc: body.desc,
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
