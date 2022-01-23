<?php

/**
 * @file
 * All settings.
 */

use Drupal\Core\Installer\InstallerKernel;

$settings['config_sync_directory'] = '../config/sync';

if (getenv('LAGOON')) {

  // The default list of directories that will be ignored by Drupal's file API.
  if (empty($settings['file_scan_ignore_directories'])) {
    $settings['file_scan_ignore_directories'] = [
      'node_modules',
      'bower_components',
    ];
  }

  // Lagoon readreplica database connection.
  if (getenv('MARIADB_READREPLICA_HOSTS')) {
    $databases['readreplica']['default'] = [
      'driver' => 'mysql',
      'database' => getenv('MARIADB_DATABASE') ?: 'drupal',
      'username' => getenv('MARIADB_USERNAME') ?: 'drupal',
      'password' => getenv('MARIADB_PASSWORD') ?: 'drupal',
      'host' => getenv('MARIADB_READREPLICA_HOSTS') ?: 'mariadb',
      'port' => 3306,
      'prefix' => '',
    ];
  }

  // Redis configuration.
  $redis = new \Redis();
  $redis_host = getenv('REDIS_HOST') ?: 'redis';
  $redis_port = getenv('REDIS_SERVICE_PORT') ?: 6379;
  try {
    // Do not use the cache during installations of Drupal.
    if (InstallerKernel::installationAttempted()) {
      throw new \Exception('Drupal installation underway.');
    }

    // Use a timeout to ensure that if the Redis pod is down, that Drupal will
    // continue to function.
    if ($redis->connect($redis_host, $redis_port, 1) === FALSE) {
      throw new \Exception('Redis server unreachable.');
    }

    $response = $redis->ping();
    if (strpos($response, 'PONG') === FALSE) {
      throw new \Exception('Redis could be reached but is not responding correctly.');
    }

    $settings['redis.connection']['interface'] = 'PhpRedis';
    $settings['redis.connection']['host'] = $redis_host;
    $settings['redis.connection']['port'] = $redis_port;
    $settings['cache_prefix']['default'] = getenv('REDIS_CACHE_PREFIX') ?: getenv('LAGOON_PROJECT') . '_' . getenv('LAGOON_GIT_SAFE_BRANCH');

    $settings['cache']['default'] = 'cache.backend.redis';

    // Include the default example.services.yml from the module, which will
    // replace all supported backend services (that currently includes the cache
    // tags checksum service and the lock backends, check the file for the
    // current list).
    $settings['container_yamls'][] = 'modules/contrib/redis/example.services.yml';

    // Allow the services to work before the Redis module itself is enabled.
    $settings['container_yamls'][] = 'modules/contrib/redis/redis.services.yml';

    // Manually add the classloader path, this is required for the container
    // cache bin definition below
    // and allows to use it without the redis module being enabled.
    $class_loader->addPsr4('Drupal\\redis\\', 'modules/contrib/redis/src');

    // Use redis for container cache.
    // The container cache is used to load the container definition itself, and
    // thus any configuration stored in the container itself is not available
    // yet. These lines force the container cache to use Redis rather than the
    // default SQL cache.
    $settings['bootstrap_container_definition'] = [
      'parameters' => [],
      'services' => [
        'redis.factory' => [
          'class' => 'Drupal\redis\ClientFactory',
        ],
        'cache.backend.redis' => [
          'class' => 'Drupal\redis\Cache\CacheBackendFactory',
          'arguments' => [
            '@redis.factory',
            '@cache_tags_provider.container',
            '@serialization.phpserialize',
          ],
        ],
        'cache.container' => [
          'class' => '\Drupal\redis\Cache\PhpRedis',
          'factory' => ['@cache.backend.redis', 'get'],
          'arguments' => ['container'],
        ],
        'cache_tags_provider.container' => [
          'class' => 'Drupal\redis\Cache\RedisCacheTagsChecksum',
          'arguments' => ['@redis.factory'],
        ],
        'serialization.phpserialize' => [
          'class' => 'Drupal\Component\Serialization\PhpSerialize',
        ],
      ],
    ];
  }
  catch (\Exception $error) {
    // Fallback setting for Redis.
    $settings['container_yamls'][] = __DIR__ . '/redis-unavailable.services.yml';
    $settings['cache']['default'] = 'cache.backend.null';
  }

  // Lagoon Elastic connection.
  // WARNING: you have to create an elasticsearch cluster called "elastic" at
  // /admin/config/search/elasticsearch-connector and a search_api server called
  // "elastic" at /admin/config/search/search-api/add-server to make this work.
  // We provide reasonable fallbacks and possibilities for overriding
  // elasticsearch details.
  // LAGOON_ELASTIC_CLUSTER_ID // defaults to "elasticsearch".
  // LAGOON_ELASTIC_CLUSTER_NAME // will default to ID.
  // LAGOON_ELASTIC_CLUSTER_PORT // defaults to 9200.
  $elasticClusterId = getenv("LAGOON_ELASTIC_CLUSTER_ID");
  $elasticClusterId = $elasticClusterId != FALSE ? $elasticClusterId : "elasticsearch";
  $elasticClusterName = getenv("LAGOON_ELASTIC_CLUSTER_NAME");
  $elasticClusterName = $elasticClusterName != FALSE ? $elasticClusterName : $elasticClusterId;
  $elasticClusterPort = getenv("LAGOON_ELASTIC_CLUSTER_PORT");
  $elasticClusterPort = $elasticClusterPort != FALSE ? $elasticClusterPort : "9200";

  $config['elasticsearch_connector.cluster.elasticsearch']['cluster_id'] = $elasticClusterId;
  $config['elasticsearch_connector.cluster.elasticsearch']['name'] = $elasticClusterName;
  $config['elasticsearch_connector.cluster.elasticsearch']['status'] = '1';
  $config['elasticsearch_connector.cluster.elasticsearch']['url'] = sprintf("http://%s:%s", $elasticClusterId, $elasticClusterPort);
  $config['elasticsearch_connector.cluster.elasticsearch']['options']['use_authentication'] = '0';
  $config['search_api.server.elasticsearch']['backend_config']['cluster_settings']['cluster'] = $elasticClusterId;
  $config['search_api.server.elasticsearch']['name'] = 'Lagoon Elastic - Environment: ' . getenv('LAGOON_PROJECT');


  // Lagoon Solr connection.
  // WARNING: you have to create a search_api server having "solr" machine
  // name a /admin/config/search/search-api/add-server to make this work.
  $config['search_api.server.solr']['backend_config']['connector_config']['host'] = getenv('SOLR_HOST') ?: 'solr';
  $config['search_api.server.solr']['backend_config']['connector_config']['path'] = '/';
  $config['search_api.server.solr']['backend_config']['connector_config']['core'] = getenv('SOLR_CORE') ?: 'drupal';
  $config['search_api.server.solr']['backend_config']['connector_config']['port'] = 8983;
  $config['search_api.server.solr']['backend_config']['connector_config']['http_user'] = (getenv('SOLR_USER') ?: '');
  $config['search_api.server.solr']['backend_config']['connector_config']['http']['http_user'] = (getenv('SOLR_USER') ?: '');
  $config['search_api.server.solr']['backend_config']['connector_config']['http_pass'] = (getenv('SOLR_PASSWORD') ?: '');
  $config['search_api.server.solr']['backend_config']['connector_config']['http']['http_pass'] = (getenv('SOLR_PASSWORD') ?: '');
  $config['search_api.server.solr']['name'] = 'Lagoon Solr - Environment: ' . getenv('LAGOON_PROJECT');

}
