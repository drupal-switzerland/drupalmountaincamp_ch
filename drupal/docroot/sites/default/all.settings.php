<?php

/**
 * @file
 * Lagoon settings for all environments.
 */

if (getenv('LAGOON')) {
  // CORS.
  if (getenv('LAGOON_ROUTES')) {
    $routes = explode(',', getenv('LAGOON_ROUTES'));
    $settings['cors_config']['allowedOrigins'] = array_map(function($route) {
      return 'https://' . trim($route);
    }, $routes);
  } else {
    $settings['cors_config']['allowedOrigins'] = ['*'];
  }
  $settings['cors_config']['enabled'] = TRUE;
  $settings['cors_config']['allowedMethods'] = ['*'];
  $settings['cors_config']['allowedHeaders'] = ['*'];
  $settings['cors_config']['exposedHeaders'] = FALSE;
  $settings['cors_config']['maxAge'] = FALSE;
  $settings['cors_config']['supportsCredentials'] = FALSE;

  // Multi-cache and Vuepal settings.
  // We use the first route for the frontend if not otherwise specified.
  if (getenv('LAGOON_ROUTES')) {
    $routes = explode(',', getenv('LAGOON_ROUTES'));
    $first_route = 'https://' . trim($routes[0]);
    $config['nuxt_multi_cache.settings']['endpoint'] = $first_route . '/api/multi-cache';
    $config['nuxt_multi_cache.settings']['frontend'] = $first_route;

    // Sitemap links must use the public route. The exported config carries a
    // local dev value, and cron generates the sitemap from CLI where Drupal
    // cannot derive the host itself.
    $config['simple_sitemap.settings']['base_url'] = $first_route;
  }

  // The exported transport points at the local mailpit container, which does
  // not exist on Lagoon - without this nothing is ever delivered. native://
  // hands the mail to PHP's configured sendmail, which the cluster relays.
  $config['symfony_mailer_lite.symfony_mailer_lite_transport.dsn']['configuration']['dsn'] = 'native://default';
}
