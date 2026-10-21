import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouterContext, type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import InterestProfile from "../components/interest-profile";

const router = { push() {}, replace() {}, refresh() {}, back() {}, forward() {}, prefetch() {} } as unknown as AppRouterInstance;

test("InterestProfile renders the interests form with a save button", () => {
	const markup = renderToStaticMarkup(
		<AppRouterContext.Provider value={router}>
			<InterestProfile />
		</AppRouterContext.Provider>,
	);

	assert.match(markup, /Hobbies and interests/);
	assert.match(markup, /Office location/);
	assert.match(markup, /type="submit"/);
});

test("InterestProfile saves interests to the API, not only localStorage", () => {
	const source = readFileSync(new URL("../components/interest-profile.tsx", import.meta.url), "utf8");
	const saveProfile = source.slice(source.indexOf("function saveProfile"));

	assert.match(saveProfile, /fetch\(/);
	assert.match(saveProfile, /method:\s*"(POST|PUT|PATCH)"/);
});
