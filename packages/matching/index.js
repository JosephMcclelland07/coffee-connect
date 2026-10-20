function sharedInterestCount(currentInterests, candidateInterests) {
  const normalise = (interests) => new Set(interests.map((interest) => interest.trim().toLowerCase()).filter(Boolean));
  const current = normalise(currentInterests);
  return [...normalise(candidateInterests)].filter((interest) => current.has(interest)).length;
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

function selectWeightedPerson(people, currentUserId, currentInterests, draw = randomInteger) {
  const candidates = people.filter((person) => person.id !== currentUserId).map((person) => {
    const sharedInterests = sharedInterestCount(currentInterests, person.interests);
    return { person, sharedInterests, weight: 1 + sharedInterests };
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

module.exports = { sharedInterestCount, selectWeightedPerson };