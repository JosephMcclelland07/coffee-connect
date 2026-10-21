import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.API_ORIGIN || process.env.API_URL || "http://127.0.0.1:4000";
const cookieName = "coffee_connect_session";

function bearerToken() {
  return cookies().then((cookieStore) => cookieStore.get(cookieName)?.value);
}

export async function GET() {
  const token = await bearerToken();
  if (!token) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  try {
    const upstream = await fetch(`${apiUrl}/profile/me`, {
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

export async function PUT(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }
  const token = await bearerToken();
  if (!token) return NextResponse.json({ error: "Not logged in." }, { status: 401 });
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }
  try {
    const upstream = await fetch(`${apiUrl}/profile/me`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    return NextResponse.json(await upstream.json(), {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Unable to reach the account service. Please try again." }, { status: 503 });
  }
}
