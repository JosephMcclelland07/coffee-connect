import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteHeader } from "../app/site-chrome";

test("SiteHeader keeps both brands and marks the active page", async () => {
	const markup = renderToStaticMarkup(await SiteHeader({ activePage: "meetups" }));

	assert.match(markup, /alt="Bright Media"/);
	assert.match(markup, /Coffee Connect/);
	assert.match(markup, /href="#meetups"/);
	assert.match(markup, /aria-current="page"/);
});