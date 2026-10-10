import { siteOrigin } from '~/helpers/site'

/**
 * Resolved once on the server, where the environment type is known, and sent
 * to the browser in the payload so the head hydrates with the same origin.
 */
export default function () {
  return useState<string>('siteOrigin', () =>
    siteOrigin(
      import.meta.server ? process.env.LAGOON_ENVIRONMENT_TYPE : undefined,
      useRequestURL().origin,
    ),
  )
}
