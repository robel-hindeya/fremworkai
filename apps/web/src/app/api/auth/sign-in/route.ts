import { NextRequest, NextResponse } from "next/server";
import { authError, authFetch, setSessionCookies, verifyAccessToken } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Please enter your email and password." }, { status: 400 });
    }

    const res = await authFetch("/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const body = await res.json();

    if (!res.ok) {
      const unconfirmed = body?.error_code === "email_not_confirmed";
      const error = unconfirmed ? "Confirm your email first. Check your inbox for the link we sent." : res.status === 429 ? "Too many attempts. Wait a few minutes and try again." : "That email and password don't match.";
      return NextResponse.json({ success: false, error }, { status: res.status === 429 ? 429 : 401 });
    }

    const response = NextResponse.json({ success: true, user: await verifyAccessToken(body.access_token) });
    setSessionCookies(response, body);
    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: authError(null, err.message) }, { status: 500 });
  }
}
