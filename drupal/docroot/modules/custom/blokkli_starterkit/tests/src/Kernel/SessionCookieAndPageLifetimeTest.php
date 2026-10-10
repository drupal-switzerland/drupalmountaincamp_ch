<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\blokkli_starterkit\Session\HostOnlySessionConfiguration;
use Drupal\Component\Serialization\Yaml;
use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use Symfony\Component\HttpFoundation\Request;

/**
 * Tests the session cookie scope and the lifetime of Drupal-served pages.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class SessionCookieAndPageLifetimeTest extends KernelTestBase {

  /**
   * Longest time a CDN or browser may keep a page no purger invalidates.
   */
  private const MAX_PAGE_LIFETIME_SECONDS = 300;

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['blokkli_starterkit', 'system'];

  /**
   * The container hands out the host-only configuration.
   */
  public function testSessionCookieHasNoDomain(): void {
    $configuration = $this->container->get('session_configuration');
    $this->assertInstanceOf(HostOnlySessionConfiguration::class, $configuration);

    $options = $configuration->getOptions(Request::create('https://drupalmountaincamp.ch/user/login'));

    $this->assertSame('', $options['cookie_domain']);
    $this->assertStringStartsWith('SSESS', $options['name']);
    $this->assertTrue($options['cookie_secure']);
  }

  /**
   * The exported max-age is positive, so pages stay cacheable, and short.
   */
  public function testExportedPageLifetimeIsShort(): void {
    $performance = Yaml::decode((string) file_get_contents(DRUPAL_ROOT . '/../config/default/system.performance.yml'));
    $maxAge = $performance['cache']['page']['max_age'];

    $this->assertGreaterThan(0, $maxAge);
    $this->assertLessThanOrEqual(self::MAX_PAGE_LIFETIME_SECONDS, $maxAge);
  }

}
