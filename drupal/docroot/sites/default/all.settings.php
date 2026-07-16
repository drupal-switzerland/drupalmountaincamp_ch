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
  }
}
