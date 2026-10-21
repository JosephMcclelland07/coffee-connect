import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const apiUrl = process.env.API_ORIGIN || process.env.API_URL || "http://127.0.0.1:4000";
const cookieName = "coffee_connect_session";

async function bearerToken() {
  const cookieStore = await cookies();
  return cookieStore.get(cookieName)?.value;
}

async function forward(request: NextRequest, method: string, path: string[]) {
  const token = await bearerToken();
  if (!token) return NextResponse.json({ error: "Not logged in." }, { status: 401 });

  if (!["GET", "HEAD"].includes(method) && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const upstreamUrl = `${apiUrl}/scheduler/${path.join("/")}${request.nextUrl.search}`;
  try {
    const body = ["GET", "HEAD"].includes(method) ? undefined : await request.text();
    const upstream = await fetch(upstreamUrl, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const payload = await upstream.text();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Scheduler service unavailable." }, { status: 503 });
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, "GET", path);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, "POST", path);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return forward(request, "PATCH", path);
}
