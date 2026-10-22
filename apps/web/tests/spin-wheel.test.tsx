import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import SpinWheel from "../components/spin-wheel";

// Tests for the SpinWheel component, ensuring it renders correctly based on the current user and available people to meet.

const people = [
	{ id: "1", name: "Ada", interests: ["coffee"] },
	{ id: "2", name: "Grace", interests: ["coffee", "hiking"] },
	{ id: "3", name: "Linus", interests: ["hiking"] },
];

test("SpinWheel renders the control with colleagues but not the current user", () => {
	const markup = renderToStaticMarkup(
		<SpinWheel currentUserId="1" currentUserInterests={["coffee"]} people={people} />,
	);

	assert.match(markup, /aria-label="Spin the meetup wheel"/);
	assert.match(markup, />Grace</);
	assert.match(markup, />Linus</);
	assert.doesNotMatch(markup, />Ada</);
	assert.doesNotMatch(markup, /disabled/);
});

test("SpinWheel is disabled when there is nobody else to meet", () => {
	const markup = renderToStaticMarkup(
		<SpinWheel currentUserId="1" currentUserInterests={[]} people={[people[0]]} />,
	);

	assert.match(markup, /disabled/);
});
