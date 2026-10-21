import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

// Tests for the SignupForm component, ensuring it has the necessary fields and posts registration to the API.

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("SignupForm has name, email and password fields and posts registration to /api/auth", () => {
	const source = read("../components/signup-form.tsx");

	assert.match(source, /name="name"/);
	assert.match(source, /name="email"/);
	assert.match(source, /name="password"/);
	assert.match(source, /fetch\("\/api\/auth"/);
	assert.match(source, /method:\s*"POST"/);
	assert.match(source, /mode:\s*"register"/);
});

test("The /api/auth route forwards registration to the API", () => {
	const source = read("../app/api/auth/route.ts");

	assert.match(source, /\$\{apiUrl\}\/auth\/\$\{body\.mode\}/);
});

test("The API register route creates an employee in the database", () => {
	const source = read("../../api/src/routes/auth.ts");
	const register = source.slice(source.indexOf('authRouter.post("/register"'));

	assert.match(register, /employee\.create\(/);
});
