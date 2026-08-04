export type Interval = {
  start: Date;
  end: Date;
};

/**
 * Two intervals overlap only when they share more than a boundary point,
 * so a booking ending exactly when another starts does not conflict.
 */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end;
}
