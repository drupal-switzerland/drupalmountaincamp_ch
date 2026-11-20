/**
 * Swiper's JS, loaded only when a list is shown as a slider. A module of its
 * own so that tests can replace it: vitest's mock of 'swiper' holds only for
 * the first dynamic import of it in a test file.
 */
export async function loadSwiper() {
  return (await import('swiper')).default
}
