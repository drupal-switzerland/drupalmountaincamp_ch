/**
 * Page number from a `?page=` query value: a positive integer, 1 otherwise
 * (missing, empty, negative, zero, decimal or non-numeric).
 */
export function parsePageParam(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string' || !/^\d+$/.test(raw)) {
    return 1
  }
  const page = Number(raw)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize))
}
