// Hostnames visitors use on production: the routes in .lagoon.yml. Keep in
// sync with the $proxy_x_forwarded_host map in .lagoon/nginx-lagoon.conf.
export const PRODUCTION_HOSTS = [
  'drupalmountaincamp.ch',
  'www.drupalmountaincamp.ch',
  'cfp.drupalmountaincamp.ch',
] as const

export const CANONICAL_HOST = PRODUCTION_HOSTS[0]

/** Value of Lagoon's LAGOON_ENVIRONMENT_TYPE on the production environment. */
export const PRODUCTION_ENVIRONMENT_TYPE = 'production'
