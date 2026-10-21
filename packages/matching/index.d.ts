export type MatchingPerson = { id: string; interests: readonly string[]; categories?: readonly (string | number)[] };

export function sharedInterestCount(currentInterests: readonly string[], candidateInterests: readonly string[]): number;
export function sharedCategoryCount(currentCategories: readonly (string | number)[], candidateCategories: readonly (string | number)[]): number;
export function topMatchPeople<Person extends MatchingPerson>(
  people: readonly Person[],
  currentUserId: string,
  currentInterests: readonly string[],
  currentCategories?: readonly (string | number)[],
  maximumVisible?: number,
): Person[];

export function selectWeightedPerson<Person extends MatchingPerson>(
  people: readonly Person[],
  currentUserId: string,
  currentInterests: readonly string[],
  draw?: (maximum: number) => number,
  currentCategories?: readonly (string | number)[],
): { person: Person; sharedInterests: number; sharedCategories: number; weight: number } | undefined;