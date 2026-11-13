/**
 * Runs the request preparation. If it throws, the request still goes out, but
 * without the forwarded headers, so the page rendered from it is not cached.
 */
export function prepareGraphqlRequest(
  prepare: () => void,
  markPageUncacheable: () => void,
) {
  try {
    prepare()
  } catch (e) {
    console.error('Failed to prepare the GraphQL request.', e)
    markPageUncacheable()
  }
}
