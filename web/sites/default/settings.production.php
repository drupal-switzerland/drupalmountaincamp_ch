<?php
/**
 * @file
 * AmazeeIO Drupal 8 production environment configuration file.
 *
 * This file will only be included on production environments.
 */

### If the Base URL of Production is different then AMAZEEIO_SITE_URL (like runs on https or without a www in front).
### Adapt it here:
if (getenv('AMAZEEIO_BASE_URL')) {
  $base_url = getenv('AMAZEEIO_BASE_URL');
}

### Trusted Host Patterns for production, see https://www.drupal.org/node/2410395 for more information.
### In case the site runs without www, change it to:
###   '^' . str_replace('.', '\.', getenv('AMAZEEIO_SITE_URL')) . '$',
### In case the site runs on another URL, change it like:
###   '^www\.example\.com$',
$settings['trusted_host_patterns'] = array(
  '^' . str_replace('.', '\.', getenv('AMAZEEIO_SITE_URL')) . '$',
);

# On production, we enable the cache and the css and js aggregation.
$config['system.performance']['cache']['page']['max_age'] = 600;
$config['system.performance']['css']['preprocess'] = 1;
$config['system.performance']['js']['preprocess'] = 1;

$config['system.logging']['error_level'] = 'hide';
