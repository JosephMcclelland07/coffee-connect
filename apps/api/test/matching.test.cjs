const { test } = require("node:test");
const assert = require("node:assert/strict");
const { selectWeightedPerson, sharedCategoryCount, sharedInterestCount, topMatchPeople } = require("@coffee-connect/matching");

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

test("matching weight increases for shared interests while equal-interest candidates stay equally weighted", () => {
  const people = [
    { id: "self", interests: ["Coffee"], categories: [1, 2] },
    { id: "other-category", interests: ["Books"], categories: [3] },
    { id: "same-category", interests: ["Tea"], categories: [1] },
    { id: "same-interest", interests: ["coffee"], categories: [1] },
  ];
  const weights = new Map();

  for (let ticket = 0; ticket < 4; ticket++) {
    const result = selectWeightedPerson(people, "self", ["Coffee"], (maximum) => {
      assert.equal(maximum, 4);
      return ticket;
    }, [1, 2]);
    weights.set(result.person.id, (weights.get(result.person.id) || 0) + 1);
  }

  assert.deepEqual(Object.fromEntries(weights), {
    "other-category": 1,
    "same-category": 1,
    "same-interest": 2,
  });
  assert.equal(sharedCategoryCount([1, "2", 2], ["1", 2, 2]), 2);
});

test("wheel uses the top 8 ranked by shared interests, then categories, then name", () => {
  const people = [
    { id: "self", name: "Self", interests: ["Coffee", "Travel"], categories: ["A"] },
    { id: "1", name: "Zoe", interests: ["Coffee", "Travel"], categories: ["A"] },
    { id: "2", name: "Amy", interests: ["Coffee", "Travel"], categories: ["A"] },
    { id: "3", name: "Ben", interests: ["Coffee", "Travel"], categories: ["A"] },
    { id: "4", name: "Cal", interests: ["Coffee"], categories: ["A"] },
    { id: "5", name: "Dan", interests: ["Coffee"], categories: ["A"] },
    { id: "6", name: "Eve", interests: ["Coffee"], categories: ["B"] },
    { id: "7", name: "Fay", interests: [], categories: ["A"] },
    { id: "8", name: "Gio", interests: [], categories: [] },
    { id: "9", name: "Hal", interests: [], categories: [] },
    { id: "10", name: "Ian", interests: [], categories: [] },
  ];

  const visible = topMatchPeople(people, "self", ["Coffee", "Travel"], ["A"], 8);

  assert.equal(visible.length, 8);
  assert.deepEqual(visible.map((person) => person.id), ["2", "3", "1", "4", "5", "6", "7", "8"]);
});
