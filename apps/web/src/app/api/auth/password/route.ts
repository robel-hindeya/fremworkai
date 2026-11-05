import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, authError, authFetch, verifyAccessToken } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (!(await verifyAccessToken(token))) {
    return NextResponse.json({ success: false, error: "This reset link has expired. Request a new one." }, { status: 401 });
  }
  const { password } = await req.json();
  const res = await authFetch("/user", { method: "PUT", token, body: JSON.stringify({ password }) });
  if (!res.ok) {
    return NextResponse.json({ success: false, error: authError(await res.json().catch(() => null), "We couldn't change your password.") }, { status: res.status });
  }
  return NextResponse.json({ success: true });
}
