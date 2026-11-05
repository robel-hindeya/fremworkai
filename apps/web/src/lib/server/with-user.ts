import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, verifyAccessToken } from "./auth";
import { userScope } from "./db";

/** Wraps a route handler so it only runs for a signed-in user, against that user's own database. */
export function authed<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    const user = await verifyAccessToken((await cookies()).get(ACCESS_COOKIE)?.value);
    if (!user) return NextResponse.json({ success: false, error: "Please sign in." }, { status: 401 });
    return userScope.run(user.id, () => handler(...args));
  };
}
