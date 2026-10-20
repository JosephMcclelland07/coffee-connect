export type MatchingPerson = { id: string; interests: readonly string[] };

export function sharedInterestCount(currentInterests: readonly string[], candidateInterests: readonly string[]): number;

export function selectWeightedPerson<Person extends MatchingPerson>(
  people: readonly Person[],
  currentUserId: string,
  currentInterests: readonly string[],
  draw?: (maximum: number) => number,
): { person: Person; sharedInterests: number; weight: number } | undefined;