<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the TMGMT post updates without TMGMT.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class DeleteTmgmtJobsWithoutTmgmtTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = ['system'];

  /**
   * The update does nothing once TMGMT's code is gone.
   */
  public function testWithoutTmgmt(): void {
    require_once __DIR__ . '/../../../blokkli_starterkit.post_update.php';
    $sandbox = [];
    $message = blokkli_starterkit_post_update_delete_tmgmt_jobs($sandbox);
    $this->assertSame(1, $sandbox['#finished']);
    $this->assertSame('TMGMT is not installed, no translation jobs to delete.', $message);
  }

  /**
   * Without TMGMT no English overrides are deleted.
   */
  public function testEnglishOverridesWithoutTmgmt(): void {
    require_once __DIR__ . '/../../../blokkli_starterkit.post_update.php';
    $this->assertSame('TMGMT is not installed, no English overrides to delete.', blokkli_starterkit_post_update_delete_tmgmt_english_overrides());
  }

}
