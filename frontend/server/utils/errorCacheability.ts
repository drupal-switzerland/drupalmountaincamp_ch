const FIRST_ERROR_STATUS = 400

/**
 * Whether a response with this status may keep a cacheable CDN header. Only a
 * known status below 400 may: anything else counts as an error.
 */
export function isCdnCacheableStatus(status: unknown): boolean {
  return (
    typeof status === 'number' &&
    Number.isInteger(status) &&
    status > 0 &&
    status < FIRST_ERROR_STATUS
  )
}
