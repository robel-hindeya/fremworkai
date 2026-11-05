import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, authFetch, clearSessionCookies, verifyAccessToken } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await verifyAccessToken(req.cookies.get(ACCESS_COOKIE)?.value);
  return NextResponse.json({ success: true, user });
}

/** Sign out. */
export async function POST(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  if (token) await authFetch("/logout", { method: "POST", token }).catch(() => {});
  const response = NextResponse.json({ success: true, message: "Signed out" });
  clearSessionCookies(response);
  return response;
}
