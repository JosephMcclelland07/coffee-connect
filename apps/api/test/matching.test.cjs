const { test } = require("node:test");
const assert = require("node:assert/strict");
const { selectWeightedPerson, sharedInterestCount } = require("@coffee-connect/matching");

test("every candidate gets a ticket and shared interests increase selection weight", () => {
  const people = [
    { id: "self", interests: ["Coffee", "Travel", "AI"] },
    { id: "none", interests: ["Books"] },
    { id: "one", interests: ["Coffee"] },
    { id: "three", interests: ["Coffee", "Travel", "AI"] },
  ];
  const counts = new Map();
  for (let ticket = 0; ticket < 7; ticket++) {
    const winner = selectWeightedPerson(people, "self", people[0].interests, (maximum) => {
      assert.equal(maximum, 7);
      return ticket;
    });
    counts.set(winner.person.id, (counts.get(winner.person.id) || 0) + 1);
  }
  assert.deepEqual(Object.fromEntries(counts), { none: 1, one: 2, three: 4 });
  assert.equal(counts.has("self"), false);
});

test("interest normalisation avoids duplicate weight", () => {
  assert.equal(sharedInterestCount([" Coffee ", "AI", ""], ["coffee", "COFFEE", " ai ", " "]), 2);
});