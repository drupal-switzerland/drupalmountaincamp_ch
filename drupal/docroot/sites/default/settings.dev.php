<?php

## Custom Settings for DEV Environment

# Custom service parameters.
# $settings['container_yamls'][] = DRUPAL_ROOT . '/sites/default/settings.dev.yml';

# Environment Indicator
$config['environment_indicator.indicator']['bg_color'] = '#001AFF';
$config['environment_indicator.indicator']['fg_color'] = '#000000';
$config['environment_indicator.indicator']['name'] = 'MOUNTAINCAMP DEV';

$config['system.logging']['error_level'] = 'verbose';

$settings['file_private_path'] = '../files-private/';

// Memcached
if (getenv('LAGOON')) {
  $settings['memcache']['servers'] = ['memcached:11211' => 'default'];
  $settings['memcache']['bins'] = ['default' => 'default'];
  $settings['memcache']['key_prefix'] = 'dev_';
  $settings['cache']['default'] = 'cache.backend.memcache';
}

$config['rokka.settings']['organization_name'] = 'mountaincamp-develop';

// Set this temporarily to TRUE to import ignored config such as webforms.
$settings['config_ignore_deactivate'] = FALSE;

// Symfony Mailer Lite
$config['symfony_mailer_lite.symfony_mailer_lite_transport.dsn']['configuration']['dsn'] = 'smtp://localhost:1025';

// Elastic Search
$elasticsearch_host = getenv('ELASTICSEARCH_HOST') ?: 'elasticsearch';
$config['search_api.server.elasticsearch']['backend_config']['connector_config']['url'] = 'http://' . $elasticsearch_host . ':9200';
$config['search_api.server.elasticsearch']['backend_config']['advanced']['prefix'] = 'develop_';

/**
 * Trusted Host Settings.
 */
if (!getenv('LAGOON')) {
  $settings['trusted_host_patterns'] = [
    '^develop\.domain\.ch$',
    '^www\.develop\.domain\.ch$',
    '^localhost$',
  ];
}
