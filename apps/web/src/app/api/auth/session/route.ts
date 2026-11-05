import { NextRequest, NextResponse } from "next/server";
import { setSessionCookies, verifyAccessToken } from "@/lib/server/auth";

export const runtime = "nodejs";

/** Turns the tokens from an email link into a signed-in session. */
export async function POST(req: NextRequest) {
  const { access_token, refresh_token, expires_in } = await req.json();
  const user = await verifyAccessToken(access_token);
  if (!user || !refresh_token) {
    return NextResponse.json({ success: false, error: "This link is invalid or has expired." }, { status: 401 });
  }
  const response = NextResponse.json({ success: true, user });
  setSessionCookies(response, { access_token, refresh_token, expires_in: Number(expires_in) || 3600 });
  return response;
}
