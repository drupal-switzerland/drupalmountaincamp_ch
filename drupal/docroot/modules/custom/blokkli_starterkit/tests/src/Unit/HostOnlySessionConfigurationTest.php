<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Unit;

use Drupal\blokkli_starterkit\Session\HostOnlySessionConfiguration;
use Drupal\Core\Session\SessionConfiguration;
use Drupal\Tests\UnitTestCase;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use Symfony\Component\HttpFoundation\Request;

/**
 * Tests the host-only session cookie configuration.
 */
#[CoversClass(HostOnlySessionConfiguration::class)]
#[Group('blokkli_starterkit')]
class HostOnlySessionConfigurationTest extends UnitTestCase {

  /**
   * Builds a configuration that never sees a test user agent.
   *
   * @param class-string<\Drupal\Core\Session\SessionConfiguration> $class
   *   The configuration class.
   * @param array $options
   *   The session.storage.options parameter.
   */
  private function configuration(string $class, array $options = []): SessionConfiguration {
    $configuration = $this->getMockBuilder($class)
      ->onlyMethods(['drupalValidTestUa'])
      ->setConstructorArgs([$options])
      ->getMock();
    $configuration->method('drupalValidTestUa')->willReturn(FALSE);
    return $configuration;
  }

  /**
   * The cookie name core derives from a host plus the host-only suffix.
   */
  private function expectedName(string $prefix, string $host): string {
    return $prefix . substr(hash('sha256', $host . HostOnlySessionConfiguration::NAME_SUFFIX), 0, 32);
  }

  /**
   * No host gets a Domain attribute, whatever core would have sent.
   */
  #[DataProvider('hosts')]
  public function testCookieIsHostOnly(string $url, string $coreDomain, string $prefix, string $host): void {
    $request = Request::create($url);
    $this->assertSame($coreDomain, $this->configuration(SessionConfiguration::class)->getOptions($request)['cookie_domain']);

    $options = $this->configuration(HostOnlySessionConfiguration::class)->getOptions($request);

    $this->assertSame('', $options['cookie_domain']);
    $this->assertSame($this->expectedName($prefix, $host), $options['name']);
    $this->assertSame($prefix === 'SSESS', $options['cookie_secure']);
  }

  /**
   * Request URL, the domain core sets, the name prefix and the host.
   */
  public static function hosts(): array {
    return [
      'production apex' => ['https://drupalmountaincamp.ch/user/login', '.drupalmountaincamp.ch', 'SSESS', 'drupalmountaincamp.ch'],
      'ddev' => ['https://mountaincamp.ddev.site/', '.mountaincamp.ddev.site', 'SSESS', 'mountaincamp.ddev.site'],
      'localhost' => ['http://localhost/', '', 'SESS', 'localhost'],
      'ip address' => ['http://127.0.0.1/', '', 'SESS', '127.0.0.1'],
    ];
  }

  /**
   * The name differs from core's, so a legacy domain cookie cannot shadow it.
   */
  public function testNameDiffersFromCore(): void {
    $request = Request::create('https://drupalmountaincamp.ch/');
    $coreName = $this->configuration(SessionConfiguration::class)->getOptions($request)['name'];
    $configuration = $this->configuration(HostOnlySessionConfiguration::class);

    $this->assertNotSame($coreName, $configuration->getOptions($request)['name']);

    $request->cookies->set($coreName, 'legacy');
    $this->assertFalse($configuration->hasSession($request));
    $request->cookies->set($configuration->getOptions($request)['name'], 'current');
    $this->assertTrue($configuration->hasSession($request));
  }

  /**
   * The storage options are passed through with a suffixed name_suffix.
   */
  public function testStorageOptionsAreKept(): void {
    $request = Request::create('https://drupalmountaincamp.ch/');
    $options = $this->configuration(HostOnlySessionConfiguration::class, ['cookie_lifetime' => 2000000, 'name_suffix' => 'x'])->getOptions($request);

    $this->assertSame(2000000, $options['cookie_lifetime']);
    $this->assertSame('SSESS' . substr(hash('sha256', 'drupalmountaincamp.chx' . HostOnlySessionConfiguration::NAME_SUFFIX), 0, 32), $options['name']);
  }

  /**
   * A cookie domain set in session.storage.options is still honoured.
   */
  public function testConfiguredCookieDomainIsKept(): void {
    $request = Request::create('https://drupalmountaincamp.ch/');
    $options = $this->configuration(HostOnlySessionConfiguration::class, ['cookie_domain' => '.drupalmountaincamp.ch'])->getOptions($request);

    $this->assertSame('.drupalmountaincamp.ch', $options['cookie_domain']);
  }

}
