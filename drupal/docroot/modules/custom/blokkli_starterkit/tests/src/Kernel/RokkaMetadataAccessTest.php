<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Component\Serialization\Yaml;
use Drupal\Core\Session\AnonymousUserSession;
use Drupal\KernelTests\KernelTestBase;
use Drupal\rokka\Entity\RokkaMetadata;
use Drupal\Tests\user\Traits\UserCreationTrait;
use Drupal\user\Entity\Role;
use Drupal\user\RoleInterface;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that visitors can read rokka metadata, which images need on the site.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class RokkaMetadataAccessTest extends KernelTestBase {

  use UserCreationTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'blokkli_starterkit',
    'crop',
    'file',
    'filter',
    'image',
    'media',
    'rokka',
    'system',
    'user',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installConfig(['filter']);

    // The roles as exported, so the test fails if the grant is dropped.
    foreach ([RoleInterface::ANONYMOUS_ID, RoleInterface::AUTHENTICATED_ID] as $id) {
      $values = Yaml::decode((string) file_get_contents(DRUPAL_ROOT . "/../config/default/user.role.$id.yml"));
      unset($values['dependencies']['config']);
      Role::create($values)->save();
    }
  }

  /**
   * Anonymous and logged-in users can view rokka metadata.
   */
  public function testVisitorsCanViewRokkaMetadata(): void {
    $metadata = RokkaMetadata::create([
      'uri' => 'rokka://test.jpg',
      'hash' => $this->randomMachineName(40),
    ]);

    $this->assertTrue($metadata->access('view', new AnonymousUserSession()));
    $this->assertTrue($metadata->access('view', $this->createUser()));
    $this->assertFalse($metadata->access('update', new AnonymousUserSession()));
  }

}
