<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Unit;

use Drupal\Tests\UnitTestCase;
use PHPUnit\Framework\Attributes\Group;
use Symfony\Component\HttpFoundation\Request;

/**
 * Tests what sites/default/settings.php decides from the environment.
 *
 * Includes the real settings files, with every environment variable they read
 * set or cleared for the duration of one test.
 */
#[Group('blokkli_starterkit')]
class SiteSettingsTest extends UnitTestCase {

  private const SITE_PATH = 'sites/default';

  private const LAGOON = [
    'LAGOON' => '1',
    'LAGOON_ENVIRONMENT_TYPE' => 'production',
    'LAGOON_ROUTES' => 'https://nginx.example.amazee.io, https://drupalmountaincamp.ch',
    'HASH_SALT' => 'salt-from-lagoon',
    'MARIADB_HOST' => 'mariadb-host',
    'MARIADB_DATABASE' => 'lagoon_db',
    'MARIADB_USERNAME' => 'lagoon_user',
    'MARIADB_PASSWORD' => 'lagoon_pass',
  ];

  /**
   * Every variable the settings files read; unset unless a test sets it.
   */
  private const ENVIRONMENT = [
    'LAGOON',
    'LAGOON_ENVIRONMENT_TYPE',
    'LAGOON_ROUTES',
    'HASH_SALT',
    'MARIADB_HOST',
    'MARIADB_DATABASE',
    'MARIADB_USERNAME',
    'MARIADB_PASSWORD',
    'MARIADB_PORT',
    'MARIADB_CHARSET',
    'MARIADB_COLLATION',
    'MYSQL_DATABASE',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_HOSTNAME',
    'TMP',
    'APP_ENV',
    'IS_DDEV_PROJECT',
    'DRUPAL_GRAPHQL_TOKEN',
    'ROKKA_API_KEY',
    'ROKKA_ORGANIZATION_NAME',
    'DEEPL_AUTH_KEY',
    'AMAZEEAI_HOST',
    'AMAZEEAI_POSTGRES_HOST',
    'AMAZEEAI_POSTGRES_PORT',
    'AMAZEEAI_POSTGRES_DEFAULT_DATABASE',
    'AMAZEEAI_POSTGRES_USERNAME',
  ];

  /**
   * Loads settings.php with exactly the given environment.
   *
   * @return array{settings: array, config: array, databases: array}
   *   The variables settings.php leaves behind.
   */
  private function loadSettings(array $environment, ?string $remoteAddress = '10.0.0.7'): array {
    $previousEnvironment = [];
    foreach (self::ENVIRONMENT as $name) {
      $previousEnvironment[$name] = getenv($name);
      isset($environment[$name]) ? putenv("$name=$environment[$name]") : putenv($name);
    }
    $previousServer = $_SERVER;
    if ($remoteAddress === NULL) {
      unset($_SERVER['REMOTE_ADDR']);
    }
    else {
      $_SERVER['REMOTE_ADDR'] = $remoteAddress;
    }

    try {
      $app_root = $this->root;
      $site_path = self::SITE_PATH;
      $settings = [];
      $config = [];
      $databases = [];
      include $app_root . '/' . $site_path . '/settings.php';
      return ['settings' => $settings, 'config' => $config, 'databases' => $databases];
    }
    finally {
      foreach ($previousEnvironment as $name => $value) {
        $value === FALSE ? putenv($name) : putenv("$name=$value");
      }
      $_SERVER = $previousServer;
    }
  }

  /**
   * On Lagoon, GraphQL errors carry no debug details and no schema is served.
   */
  public function testGraphQlDebugAndIntrospectionAreOffOnLagoon(): void {
    $server = $this->loadSettings(self::LAGOON)['config']['graphql.graphql_servers.graphql'];

    $this->assertSame(0, $server['debug_flag']);
    $this->assertTrue($server['disable_introspection']);
  }

  /**
   * Off Lagoon the exported GraphQL server config applies unchanged.
   *
   * The Nuxt dev server downloads the schema through introspection.
   */
  public function testGraphQlServerIsNotOverriddenOffLagoon(): void {
    $config = $this->loadSettings([])['config'];

    $this->assertArrayNotHasKey('graphql.graphql_servers.graphql', $config);
  }

  /**
   * The frontend URLs are the first Lagoon route, without stray whitespace.
   */
  public function testFrontendUrlsComeFromTheFirstLagoonRoute(): void {
    $config = $this->loadSettings(['LAGOON_ROUTES' => ' https://first.example , https://second.example'] + self::LAGOON)['config'];

    $this->assertSame([
      'endpoint' => 'https://first.example/api/multi-cache',
      'frontend' => 'https://first.example',
    ], $config['nuxt_multi_cache.settings']);
  }

  /**
   * Without Lagoon routes no frontend URL is made up.
   */
  public function testNoFrontendUrlsWithoutLagoonRoutes(): void {
    $withoutRoutes = self::LAGOON;
    unset($withoutRoutes['LAGOON_ROUTES']);

    $this->assertArrayNotHasKey('nuxt_multi_cache.settings', $this->loadSettings($withoutRoutes)['config']);
    $this->assertArrayNotHasKey('nuxt_multi_cache.settings', $this->loadSettings(['LAGOON_ROUTES' => ' , '] + self::LAGOON)['config']);
    $this->assertArrayNotHasKey('nuxt_multi_cache.settings', $this->loadSettings([])['config']);
  }

  /**
   * The sitemap always uses the public domain, not a Lagoon route.
   */
  public function testSitemapUsesThePublicDomainOnLagoon(): void {
    $config = $this->loadSettings(self::LAGOON)['config'];

    $this->assertSame('https://drupalmountaincamp.ch', $config['simple_sitemap.settings']['base_url']);
  }

  /**
   * Forwarded headers are trusted from the address that connects to PHP.
   */
  public function testTheConnectingAddressIsTheTrustedProxy(): void {
    $settings = $this->loadSettings(self::LAGOON, '10.1.2.3')['settings'];

    $this->assertTrue($settings['reverse_proxy']);
    $this->assertSame(['10.1.2.3'], $settings['reverse_proxy_addresses']);
    $this->assertSame(
      Request::HEADER_X_FORWARDED_FOR | Request::HEADER_X_FORWARDED_HOST | Request::HEADER_X_FORWARDED_PORT | Request::HEADER_X_FORWARDED_PROTO | Request::HEADER_FORWARDED,
      $settings['reverse_proxy_trusted_headers'],
    );
  }

  /**
   * Without a remote address (drush, cron) no proxy address is trusted.
   */
  public function testNoProxyAddressOnTheCommandLine(): void {
    $settings = $this->loadSettings(self::LAGOON, NULL)['settings'];

    $this->assertSame([''], $settings['reverse_proxy_addresses']);
  }

  /**
   * Lagoon accepts every host name; off Lagoon none is configured.
   */
  public function testTrustedHostPatterns(): void {
    $this->assertSame(['.*'], $this->loadSettings(self::LAGOON)['settings']['trusted_host_patterns']);
    $this->assertArrayNotHasKey('trusted_host_patterns', $this->loadSettings([])['settings']);
  }

  /**
   * On Lagoon the hash salt comes from the environment, not from the repo.
   */
  public function testHashSaltComesFromTheLagoonEnvironment(): void {
    $committed = $this->loadSettings([])['settings']['hash_salt'];
    $lagoon = $this->loadSettings(self::LAGOON)['settings']['hash_salt'];

    $this->assertSame(hash('sha256', 'salt-from-lagoon'), $lagoon);
    $this->assertNotSame($committed, $lagoon);

    $withoutSalt = self::LAGOON;
    unset($withoutSalt['HASH_SALT']);
    $this->assertSame(hash('sha256', 'mariadb-host'), $this->loadSettings($withoutSalt)['settings']['hash_salt']);
  }

  /**
   * The database credentials come from the variables of the platform in use.
   */
  public function testDatabaseCredentials(): void {
    $lagoon = $this->loadSettings(self::LAGOON)['databases']['default']['default'];
    $this->assertSame('lagoon_db', $lagoon['database']);
    $this->assertSame('lagoon_user', $lagoon['username']);
    $this->assertSame('lagoon_pass', $lagoon['password']);
    $this->assertSame('mariadb-host', $lagoon['host']);

    $other = $this->loadSettings([
      'MYSQL_DATABASE' => 'db',
      'MYSQL_USER' => 'user',
      'MYSQL_PASSWORD' => 'pass',
      'MYSQL_HOSTNAME' => 'host',
    ])['databases']['default']['default'];
    $this->assertSame('db', $other['database']);
    $this->assertSame('user', $other['username']);
    $this->assertSame('pass', $other['password']);
    $this->assertSame('host', $other['host']);
  }

  /**
   * Mail leaves through PHP's sendmail on Lagoon, where no mailpit runs.
   */
  public function testMailTransportOnLagoon(): void {
    $transport = 'symfony_mailer_lite.symfony_mailer_lite_transport.dsn';

    $this->assertSame('native://default', $this->loadSettings(self::LAGOON)['config'][$transport]['configuration']['dsn']);
    $this->assertArrayNotHasKey($transport, $this->loadSettings([])['config']);
  }

  /**
   * Secrets are read from the environment and never have a fallback value.
   */
  public function testSecretsComeFromTheEnvironment(): void {
    $loaded = $this->loadSettings([
      'DRUPAL_GRAPHQL_TOKEN' => 'graphql-token',
      'ROKKA_API_KEY' => 'rokka-key',
      'ROKKA_ORGANIZATION_NAME' => 'rokka-org',
      'DEEPL_AUTH_KEY' => 'deepl-key',
    ]);
    $this->assertSame('graphql-token', $loaded['settings']['access_graphql.token']);
    $this->assertSame(['api_key' => 'rokka-key', 'organization_name' => 'rokka-org'], $loaded['config']['rokka.settings']);
    $this->assertSame('deepl-key', $loaded['config']['tmgmt.translator.deepl_pro']['settings']['auth_key']);

    $this->assertFalse($this->loadSettings([])['settings']['access_graphql.token']);
  }

  /**
   * Without APP_ENV no per-environment settings file is loaded.
   */
  public function testNoEnvironmentFileWithoutAppEnv(): void {
    $this->assertArrayNotHasKey('environment_indicator.indicator', $this->loadSettings(self::LAGOON)['config']);
    $this->assertSame('MOUNTAINCAMP LIVE', $this->loadSettings(['APP_ENV' => 'live'])['config']['environment_indicator.indicator']['name']);
  }

}
