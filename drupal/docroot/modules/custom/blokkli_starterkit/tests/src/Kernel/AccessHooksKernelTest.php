<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Session\AnonymousUserSession;
use Drupal\KernelTests\KernelTestBase;
use Drupal\paragraphs\Entity\ParagraphsType;
use Drupal\system\Entity\Menu;
use Drupal\Tests\user\Traits\UserCreationTrait;
use Drupal\user\UserInterface;
use Drupal\webform\Entity\Webform;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the entity and field access hooks through the access handlers.
 *
 * Same rules as ExistingSite\AccessHooksTest, without a site install, so they
 * run wherever Kernel tests run.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class AccessHooksKernelTest extends KernelTestBase {

  use UserCreationTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'blokkli_starterkit',
    'breakpoint',
    'crop',
    'entity_reference_revisions',
    'field',
    'file',
    'filter',
    'image',
    'media',
    'paragraphs',
    'rokka',
    'system',
    'toolbar',
    'user',
    'webform',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installConfig(['filter', 'system']);
    // The first user is the administrator, who passes every access check.
    $this->createUser();
  }

  /**
   * Main and footer menus are visible to everyone, as GraphQL requires.
   */
  public function testPublicMenusAreViewableByAnyone(): void {
    $anonymous = new AnonymousUserSession();

    foreach (['main', 'footer'] as $id) {
      $menu = Menu::create(['id' => $id, 'label' => $id]);

      $this->assertTrue($menu->access('view', $anonymous), "$id is viewable");
      $this->assertFalse($menu->access('update', $anonymous), "$id is not editable");
      $this->assertFalse($menu->access('delete', $anonymous), "$id is not deletable");
    }
  }

  /**
   * The admin menu needs the toolbar permission.
   */
  public function testAdminMenuNeedsToolbarPermission(): void {
    $menu = Menu::create(['id' => 'admin', 'label' => 'Administration']);

    $this->assertFalse($menu->access('view', new AnonymousUserSession()));
    $this->assertFalse($menu->access('view', $this->createUser()));
    $this->assertTrue($menu->access('view', $this->createUser(['access toolbar'])));
  }

  /**
   * Any other menu is not opened up.
   */
  public function testOtherMenusStayClosed(): void {
    $menu = Menu::create(['id' => 'tools', 'label' => 'Tools']);

    $this->assertFalse($menu->access('view', new AnonymousUserSession()));
    $this->assertFalse($menu->access('view', $this->createUser(['access toolbar'])));
  }

  /**
   * Paragraph types can be viewed by logged-in users only.
   */
  public function testParagraphTypesNeedLogin(): void {
    $type = ParagraphsType::create(['id' => 'button', 'label' => 'Button']);

    $this->assertTrue($type->access('view', $this->createUser()));
    $this->assertFalse($type->access('view', new AnonymousUserSession()));
    $this->assertFalse($type->access('update', $this->createUser()));
  }

  /**
   * An open webform can be viewed by everyone, a closed one cannot.
   */
  public function testOnlyOpenWebformsAreViewableByAnyone(): void {
    $anonymous = new AnonymousUserSession();
    $open = Webform::create(['id' => 'contact', 'status' => 'open']);
    $closed = Webform::create(['id' => 'archive', 'status' => 'closed']);

    $this->assertTrue(blokkli_starterkit_webform_access($open, 'view', $anonymous)->isAllowed());
    $this->assertTrue(blokkli_starterkit_webform_access($closed, 'view', $anonymous)->isNeutral());
    $this->assertTrue(blokkli_starterkit_webform_access($open, 'update', $anonymous)->isNeutral());
    $this->assertTrue(blokkli_starterkit_webform_access($open, 'delete', $anonymous)->isNeutral());
    // A different entity type passed to the hook gains nothing.
    $menu = Menu::create(['id' => 'main', 'label' => 'Main']);
    $this->assertTrue(blokkli_starterkit_webform_access($menu, 'view', $anonymous)->isNeutral());
  }

  /**
   * Users see their own roles, not those of others.
   */
  public function testUsersSeeOnlyTheirOwnRoles(): void {
    $user = $this->createUser();
    $other = $this->createUser();

    $this->assertTrue($this->fieldAccess($user, 'roles', 'view', $user));
    $this->assertFalse($this->fieldAccess($user, 'roles', 'view', $other));
    $this->assertFalse($this->fieldAccess($user, 'roles', 'view', new AnonymousUserSession()));
    // Seeing them is not editing them.
    $this->assertFalse($this->fieldAccess($user, 'roles', 'edit', $user));
  }

  /**
   * The hook grants email editing for the own account only.
   */
  public function testUsersEditOnlyTheirOwnEmail(): void {
    $user = $this->createUser();
    $other = $this->createUser();
    $definition = $user->get('mail')->getFieldDefinition();

    $own = blokkli_starterkit_entity_field_access('edit', $definition, $user, $user->get('mail'));
    $foreign = blokkli_starterkit_entity_field_access('edit', $definition, $other, $user->get('mail'));
    $view = blokkli_starterkit_entity_field_access('view', $definition, $other, $user->get('mail'));

    $this->assertTrue($own->isAllowed());
    $this->assertTrue($foreign->isNeutral());
    $this->assertTrue($view->isNeutral());
    $this->assertTrue($this->fieldAccess($user, 'mail', 'edit', $user));
  }

  /**
   * The account status stays with user administrators.
   */
  public function testUserStatusIsAdminOnly(): void {
    $user = $this->createUser();

    $this->assertFalse($this->fieldAccess($user, 'status', 'view', $user));
    $this->assertFalse($this->fieldAccess($user, 'status', 'view', $this->createUser()));
    $this->assertTrue($this->fieldAccess($user, 'status', 'view', $this->createUser(['administer users'])));
  }

  /**
   * The field hook has no opinion without an entity or on another entity type.
   */
  public function testFieldHookIsNeutralOutsideUsers(): void {
    $user = $this->createUser();
    $definition = $user->get('roles')->getFieldDefinition();

    $this->assertTrue(blokkli_starterkit_entity_field_access('view', $definition, $user, NULL)->isNeutral());
  }

  /**
   * Runs the user access handler, which invokes all field access hooks.
   */
  private function fieldAccess(UserInterface $owner, string $field, string $operation, AccountInterface $account): bool {
    $items = $owner->get($field);
    return $this->container->get('entity_type.manager')
      ->getAccessControlHandler('user')
      ->fieldAccess($operation, $items->getFieldDefinition(), $account, $items);
  }

}
