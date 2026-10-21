function sharedInterestCount(currentInterests, candidateInterests) {
  const normalise = (interests) => new Set(interests.map((interest) => interest.trim().toLowerCase()).filter(Boolean));
  const current = normalise(currentInterests);
  return [...normalise(candidateInterests)].filter((interest) => current.has(interest)).length;
}

function sharedCategoryCount(currentCategories, candidateCategories) {
  const normalise = (categories) => new Set(categories.map((category) => String(category).trim().toLowerCase()).filter(Boolean));
  const current = normalise(currentCategories);
  return [...normalise(candidateCategories)].filter((category) => current.has(category)).length;
}

function topMatchPeople(people, currentUserId, currentInterests, currentCategories = [], maximumVisible = 8) {
  if (!Number.isSafeInteger(maximumVisible) || maximumVisible < 1) throw new Error("Invalid visible wheel capacity.");
  return people
    .filter((person) => person.id !== currentUserId)
    .map((person) => ({
      person,
      sharedInterests: sharedInterestCount(currentInterests, person.interests),
      sharedCategories: sharedCategoryCount(currentCategories, person.categories || []),
    }))
    .sort((left, right) => {
      const interestDelta = right.sharedInterests - left.sharedInterests;
      if (interestDelta !== 0) return interestDelta;
      const categoryDelta = right.sharedCategories - left.sharedCategories;
      if (categoryDelta !== 0) return categoryDelta;
      const leftName = typeof left.person.name === "string" ? left.person.name.trim().toLowerCase() : "";
      const rightName = typeof right.person.name === "string" ? right.person.name.trim().toLowerCase() : "";
      const nameDelta = leftName.localeCompare(rightName);
      if (nameDelta !== 0) return nameDelta;
      return String(left.person.id).localeCompare(String(right.person.id));
    })
    .slice(0, maximumVisible)
    .map((entry) => entry.person);
}

function randomInteger(maximum) {
  if (!Number.isSafeInteger(maximum) || maximum < 1 || maximum > 2 ** 32) throw new Error("Invalid matching weight total.");
  const limit = 2 ** 32 - (2 ** 32 % maximum);
  const buffer = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % maximum;
}

function selectWeightedPerson(people, currentUserId, currentInterests, draw = randomInteger, currentCategories = []) {
  const candidates = people.filter((person) => person.id !== currentUserId).map((person) => {
    const sharedInterests = sharedInterestCount(currentInterests, person.interests);
    const sharedCategories = sharedCategoryCount(currentCategories, person.categories || []);
    return { person, sharedInterests, sharedCategories, weight: 1 + sharedInterests };
  });
  if (!candidates.length) return undefined;
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  let ticket = draw(total);
  if (!Number.isSafeInteger(ticket) || ticket < 0 || ticket >= total) throw new Error("Invalid random matching ticket.");
  for (const candidate of candidates) {
    if (ticket < candidate.weight) return candidate;
    ticket -= candidate.weight;
  }
}

module.exports = { sharedInterestCount, sharedCategoryCount, topMatchPeople, selectWeightedPerson };