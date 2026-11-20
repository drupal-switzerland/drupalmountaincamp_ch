<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Component\Serialization\Yaml;
use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that the site checks for updates and mails security releases.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class UpdateStatusConfigTest extends KernelTestBase {

  private const CONFIG_DIRECTORY = DRUPAL_ROOT . '/../config/default';

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system', 'update', 'user'];

  /**
   * Update Status is enabled in the exported module list.
   */
  public function testUpdateModuleIsEnabled(): void {
    $this->assertArrayHasKey('update', $this->exportedConfig('core.extension')['module']);
  }

  /**
   * Security releases are mailed to the site address once a day.
   *
   * Saving the exported values also checks them against the config schema.
   */
  public function testSecurityReleasesAreMailed(): void {
    $this->config('update.settings')->setData($this->exportedConfig('update.settings'))->save();
    $settings = $this->config('update.settings');

    $this->assertSame('security', $settings->get('notification.threshold'));
    $this->assertSame(['info@drupalmountaincamp.ch'], $settings->get('notification.emails'));
    $this->assertSame(1, $settings->get('check.interval_days'));
  }

  /**
   * Reads a config object from the site's exported configuration.
   *
   * @return array<string, mixed>
   *   The config data.
   */
  private function exportedConfig(string $name): array {
    return Yaml::decode((string) file_get_contents(self::CONFIG_DIRECTORY . "/$name.yml"));
  }

}
