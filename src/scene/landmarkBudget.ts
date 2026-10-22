/** A landmark the map wants to draw: how far it is from the middle of the view, and whether it was within the budget before. */
export interface BudgetEntry {
  /** Metres from the middle of the view to the landmark's middle. */
  distance: number;
  /** True if it was within the budget at the last update. */
  held: boolean;
}

/**
 * Which of the landmarks the map wants it draws: the `budget` nearest to the middle of the view.
 * A landmark that was within the budget counts as `hold` metres nearer than it is, so that two
 * landmarks at about the same distance do not change places frame by frame while the map pans.
 * Equal distances keep the order given. Returns the indices of the entries within the budget,
 * nearest first.
 */
export function withinBudget(entries: readonly BudgetEntry[], budget: number, hold: number): number[] {
  return entries
    .map((e, i) => ({ i, d: e.distance - (e.held ? hold : 0) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .slice(0, Math.max(0, Math.floor(budget)))
    .map((e) => e.i);
}
