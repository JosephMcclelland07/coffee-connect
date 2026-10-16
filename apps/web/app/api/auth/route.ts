import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.API_URL || "http://localhost:4000";
const cookieName = "coffee_connect_session";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (body.mode !== "login" && body.mode !== "register") {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }
    const upstream = await fetch(`${apiUrl}/auth/${body.mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: body.name, email: body.email, password: body.password }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const result = await upstream.json();
    const response = NextResponse.json(
      upstream.ok ? { account: result.account, message: result.message } : { error: result.error },
      { status: upstream.status, headers: { "Cache-Control": "no-store" } },
    );
    if (upstream.ok && body.mode === "login" && typeof result.token === "string") {
      response.cookies.set(cookieName, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 3600,
      });
    }
    return response;
  } catch {
    return NextResponse.json({ error: "Unable to reach the account service. Please try again." }, { status: 503 });
  }
}

export async function GET() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  try {
    const upstream = await fetch(`${apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    return NextResponse.json(await upstream.json(), {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Account service unavailable." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}