import {
  assertBackendUrl,
  resolveGraphqlToken,
  serverConfigWarnings,
} from '../utils/runtimeConfigAtBoot'

// Without a backend URL the server never opens its port, so on Lagoon the
// rollout stops at the TCP healthcheck instead of serving broken pages.
export default defineNitroPlugin(() => {
  const config = useRuntimeConfig()
  config.drupalGraphqlToken = resolveGraphqlToken(
    process.env,
    config.drupalGraphqlToken,
  )
  assertBackendUrl(config)
  for (const warning of serverConfigWarnings(config)) {
    console.error(warning)
  }
})
