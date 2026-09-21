<?php

/**
 * @file
 * Lagoon settings for all environments.
 */

if (getenv('LAGOON')) {
  // Lagoon's route variables already carry the scheme, e.g.
  // "https://drupalmountaincamp.ch,https://nginx.prod.drupalmountaincamp-ch.ch4.amazee.io".
  $routes = array_filter(array_map('trim', explode(',', getenv('LAGOON_ROUTES') ?: '')));

  // CORS.
  $settings['cors_config']['allowedOrigins'] = $routes ?: ['*'];
  $settings['cors_config']['enabled'] = TRUE;
  $settings['cors_config']['allowedMethods'] = ['*'];
  $settings['cors_config']['allowedHeaders'] = ['*'];
  $settings['cors_config']['exposedHeaders'] = FALSE;
  $settings['cors_config']['maxAge'] = FALSE;
  $settings['cors_config']['supportsCredentials'] = FALSE;

  // Multi-cache and Vuepal settings.
  // We use the first route for the frontend if not otherwise specified.
  if ($routes) {
    $first_route = reset($routes);
    $config['nuxt_multi_cache.settings']['endpoint'] = $first_route . '/api/multi-cache';
    $config['nuxt_multi_cache.settings']['frontend'] = $first_route;
  }

  // Sitemap links must use the canonical public domain. It cannot be derived
  // from the route variables - the first one Lagoon hands us is the internal
  // amazee.io route - and it cannot be left empty either, because cron
  // generates the sitemap from CLI where Drupal has no request host.
  // ponytail: dev environments advertise the prod domain too; they are not
  // indexed, so nobody cares. Split per environment if that ever changes.
  $config['simple_sitemap.settings']['base_url'] = 'https://drupalmountaincamp.ch';

  // The exported transport points at the local mailpit container, which does
  // not exist on Lagoon - without this nothing is ever delivered. native://
  // hands the mail to PHP's configured sendmail, which the cluster relays.
  $config['symfony_mailer_lite.symfony_mailer_lite_transport.dsn']['configuration']['dsn'] = 'native://default';
}
