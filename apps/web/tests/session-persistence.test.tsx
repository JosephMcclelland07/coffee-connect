import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import { POST } from "../app/api/auth/route";

// Tests for session persistence, ensuring login sets a session cookie, registration does not log in, and pages read the session correctly.

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("Login sets an httpOnly session cookie that is valid across the whole site", async () => {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = (async () =>
		new Response(JSON.stringify({ account: { id: 1, name: "Ada", email: "ada@paconsulting.com" }, token: "jwt-token" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		})) as typeof fetch;

	try {
		const request = new NextRequest("http://localhost:3000/api/auth", {
			method: "POST",
			headers: { origin: "http://localhost:3000", "Content-Type": "application/json" },
			body: JSON.stringify({ mode: "login", email: "ada@paconsulting.com", password: "correct horse battery" }),
		});
		const response = await POST(request);
		const cookie = response.cookies.get("coffee_connect_session");

		assert.equal(response.status, 200);
		assert.equal(cookie?.value, "jwt-token");
		assert.equal(cookie?.path, "/");
		assert.equal(cookie?.httpOnly, true);
		assert.equal(cookie?.sameSite, "lax");
		assert.ok((cookie?.maxAge ?? 0) > 0);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("Registration does not log the user in", async () => {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = (async () =>
		new Response(JSON.stringify({ account: { id: 2 }, token: "jwt-token" }), {
			status: 201,
			headers: { "Content-Type": "application/json" },
		})) as typeof fetch;

	try {
		const request = new NextRequest("http://localhost:3000/api/auth", {
			method: "POST",
			headers: { origin: "http://localhost:3000", "Content-Type": "application/json" },
			body: JSON.stringify({ mode: "register", name: "Bob", email: "bob@paconsulting.com", password: "correct horse battery" }),
		});
		const response = await POST(request);

		assert.equal(response.cookies.get("coffee_connect_session"), undefined);
	} finally {
		globalThis.fetch = originalFetch;
	}
});

test("Pages read the same session cookie and send it to the API", () => {
	const authRoute = read("../app/api/auth/route.ts");
	const homePage = read("../app/home-page.tsx");

	assert.match(authRoute, /\(await cookies\(\)\)\.get\(cookieName\)/);
	assert.match(authRoute, /Authorization: `Bearer \$\{token\}`/);
	assert.match(homePage, /cookieStore\.get\("coffee_connect_session"\)/);
	assert.match(homePage, /authorization.*Bearer/);
});

test("The login page checks for an existing session on load", () => {
	const source = read("../app/login/login.tsx");

	assert.match(source, /useEffect\(/);
	assert.match(source, /fetch\("\/api\/auth", \{ signal/);
});
