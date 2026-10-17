type Environment = Record<string, string | undefined>

type ServerConfig = {
  backendUrl?: string
  requestHost?: string
  drupalGraphqlToken?: string
}

/**
 * The GraphQL token as the running server sees it.
 *
 * NUXT_DRUPAL_GRAPHQL_TOKEN is Nuxt's own runtime override. DRUPAL_GRAPHQL_TOKEN
 * is the variable Drupal reads at runtime (settings.php). The value read at
 * build time stays the last fallback.
 */
export function resolveGraphqlToken(
  environment: Environment,
  built = '',
): string {
  return (
    environment.NUXT_DRUPAL_GRAPHQL_TOKEN ||
    environment.DRUPAL_GRAPHQL_TOKEN ||
    built
  )
}

/**
 * Throws when the backend URL is empty: no GraphQL endpoint can be built.
 */
export function assertBackendUrl(config: ServerConfig): void {
  if (!config.backendUrl) {
    throw new Error('Runtime config is incomplete, set NUXT_BACKEND_URL.')
  }
}

/**
 * Messages for empty values the server still starts without, as it always has.
 */
export function serverConfigWarnings(config: ServerConfig): string[] {
  const warnings: string[] = []
  if (!config.requestHost) {
    warnings.push(
      'Runtime config: requestHost is empty, set NUXT_REQUEST_HOST.',
    )
  }
  if (!config.drupalGraphqlToken) {
    warnings.push(
      'Runtime config: drupalGraphqlToken is empty, set NUXT_DRUPAL_GRAPHQL_TOKEN or DRUPAL_GRAPHQL_TOKEN.',
    )
  }
  return warnings
}
