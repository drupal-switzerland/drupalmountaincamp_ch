<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Core\Update\UpdateHookRegistry;
use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests blokkli_starterkit_post_update_delete_tmgmt_deepl_schema_version().
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class DeleteTmgmtDeeplSchemaVersionTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system'];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    require_once __DIR__ . '/../../../blokkli_starterkit.post_update.php';
  }

  /**
   * The update hook registry.
   */
  private function registry(): UpdateHookRegistry {
    return $this->container->get('update.update_hook_registry');
  }

  /**
   * The leftover schema version of the removed module is deleted.
   */
  public function testDeletesLeftoverSchemaVersion(): void {
    $this->registry()->setInstalledVersion('tmgmt_deepl', 9001);
    $this->registry()->setInstalledVersion('system', 11200);

    $message = blokkli_starterkit_post_update_delete_tmgmt_deepl_schema_version();

    $this->assertSame('Deleted the schema version of tmgmt_deepl.', $message);
    $this->assertSame(UpdateHookRegistry::SCHEMA_UNINSTALLED, $this->registry()->getInstalledVersion('tmgmt_deepl'));
    $this->assertSame(11200, $this->registry()->getInstalledVersion('system'), 'Other modules keep their schema version.');
  }

  /**
   * Without a leftover entry nothing changes.
   */
  public function testNoLeftoverSchemaVersion(): void {
    $this->assertSame('tmgmt_deepl has no schema version.', blokkli_starterkit_post_update_delete_tmgmt_deepl_schema_version());
  }

}
