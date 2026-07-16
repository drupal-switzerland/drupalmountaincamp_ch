<?php

## Custom Settings for LIVE Environment

$config['system.logging']['error_level'] = 'hide';

# Environment Indicator
$config['environment_indicator.indicator']['bg_color'] = '#E9423F';
$config['environment_indicator.indicator']['fg_color'] = '#000000';
$config['environment_indicator.indicator']['name'] = 'MOUNTAINCAMP LIVE';

$settings['file_private_path'] = '../files-private/';

// Enable CSS and JS aggregation.
$config['system.performance']['css']['preprocess'] = TRUE;
$config['system.performance']['js']['preprocess'] = TRUE;

// Memcached
$settings['memcache']['servers'] = ['memcached:11211' => 'default'];
$settings['memcache']['bins'] = ['default' => 'default'];
$settings['memcache']['key_prefix'] = 'live_';
$settings['cache']['default'] = 'cache.backend.memcache';

## Rokka settings
$config['rokka.settings']['organization_name'] = 'sv';

// Set this temporarily to TRUE to import ignored config such as webforms.
$settings['config_ignore_deactivate'] = FALSE;

// Symfony Mailer Lite TODO: Change to live settings
$config['symfony_mailer_lite.symfony_mailer_lite_transport.dsn']['configuration']['dsn'] = 'smtp://localhost:1025';

// Elastic Search
$config['search_api.server.elasticsearch']['backend_config']['connector_config']['url'] = 'http://localhost:9200';
$config['search_api.server.elasticsearch']['backend_config']['advanced']['prefix'] = 'live_';

/**
 * Trusted Host Settings.
 */
$settings['trusted_host_patterns'] = [
  '^live.domain.ch$',
  '^www.live.domain.ch$',
  '^localhost$',
];
