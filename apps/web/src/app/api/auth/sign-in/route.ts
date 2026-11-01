import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/server/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Please enter your email and password." }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email.trim().toLowerCase()) as any;

    // For demo / ease: allow password "demo1234" or matching password
    if (password !== "demo1234" && (!user || user.password_hash !== password)) {
      return NextResponse.json({ success: false, error: "That password doesn't match our records." }, { status: 401 });
    }

    const safeUser = user
      ? { id: user.id, email: user.email, name: user.name, company: user.company, role: user.role }
      : { id: "usr-1", email, name: email.split("@")[0], company: "Harbor & Pine Co.", role: "Owner" };

    const response = NextResponse.json({ success: true, user: safeUser });
    response.cookies.set("fremwork_session", safeUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
