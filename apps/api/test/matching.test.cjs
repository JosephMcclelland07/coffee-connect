const { test } = require("node:test");
const assert = require("node:assert/strict");
const { selectWeightedPerson, sharedCategoryCount, sharedInterestCount, visibleWheelPeople } = require("@coffee-connect/matching");

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

test("matching weight increases for shared interests and distinct shared categories", () => {
  const people = [
    { id: "self", interests: ["Coffee"], categories: [1, 2] },
    { id: "other-category", interests: ["Books"], categories: [3] },
    { id: "same-category", interests: ["Tea"], categories: [1] },
    { id: "same-interest", interests: ["coffee"], categories: [1] },
  ];
  const weights = new Map();

  for (let ticket = 0; ticket < 6; ticket++) {
    const result = selectWeightedPerson(people, "self", ["Coffee"], (maximum) => {
      assert.equal(maximum, 6);
      return ticket;
    }, [1, 2]);
    weights.set(result.person.id, (weights.get(result.person.id) || 0) + 1);
  }

  assert.deepEqual(Object.fromEntries(weights), {
    "other-category": 1,
    "same-category": 2,
    "same-interest": 3,
  });
  assert.equal(sharedCategoryCount([1, "2", 2], ["1", 2, 2]), 2);
});

test("wheel shows at most eight people while every candidate remains selectable", () => {
  const people = Array.from({ length: 12 }, (_, index) => ({
    id: `employee-${index}`,
    interests: [],
  }));
  const candidates = people.slice(1);
  const visible = visibleWheelPeople(candidates, "employee-11");
  const selected = new Set();

  assert.equal(visible.length, 8);
  assert.equal(visible[7].id, "employee-11");
  for (let ticket = 0; ticket < candidates.length; ticket++) {
    const result = selectWeightedPerson(people, "employee-0", [], (maximum) => {
      assert.equal(maximum, candidates.length);
      return ticket;
    });
    selected.add(result.person.id);
  }
  assert.equal(selected.size, candidates.length);
});