// One or two digits at the end, not the tail of a year like 2027.
const TRAILING_DAY = /(?:^|\D)(\d{1,2})\s*$/

/**
 * The number on a week-timeline stop: the day of the month at the end of the
 * title ("Tuesday, March 2" gives "2"), else the stop's position from 1.
 */
export function dayNumber(title: string | null | undefined, index: number) {
  return title?.trim().match(TRAILING_DAY)?.[1] ?? String(index + 1)
}
