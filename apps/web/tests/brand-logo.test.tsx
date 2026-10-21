import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import BrandLogo from "../components/brand-logo";

test("BrandLogo renders the Bright Media mark beside Coffee Connect", () => {
	const markup = renderToStaticMarkup(<BrandLogo />);

	assert.match(markup, /alt="Bright Media"/);
	assert.match(markup, /class="brand-lockup-name">Coffee Connect<\/span>/);
	assert.match(markup, /brand-lockup--navigation/);
});