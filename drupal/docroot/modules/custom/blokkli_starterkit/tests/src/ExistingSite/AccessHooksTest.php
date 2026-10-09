<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\ExistingSite;

use Drupal\Core\Access\AccessResultInterface;
use Drupal\Core\Session\AccountInterface;
use Drupal\Core\Session\AnonymousUserSession;
use Drupal\paragraphs\Entity\ParagraphsType;
use Drupal\system\Entity\Menu;
use Drupal\user\UserInterface;

/**
 * Tests the entity and field access hooks of blokkli_starterkit.
 */
class AccessHooksTest extends BlokkliStarterkitExistingSiteBase {

  /**
   * Main and footer menus are visible to everyone, as GraphQL requires.
   */
  public function testPublicMenusAreViewableByAnyone(): void {
    $anonymous = new AnonymousUserSession();

    foreach (['main', 'footer'] as $id) {
      $menu = $this->loadMenu($id);
      $this->assertTrue(blokkli_starterkit_menu_access($menu, 'view', $anonymous)->isAllowed(), $id);
      $this->assertTrue($menu->access('view', $anonymous), $id);
      $this->assertTrue(blokkli_starterkit_menu_access($menu, 'update', $anonymous)->isNeutral(), $id);
    }
  }

  /**
   * The admin menu needs the toolbar permission.
   */
  public function testAdminMenuNeedsToolbarPermission(): void {
    $menu = $this->loadMenu('admin');

    $this->assertFalse(blokkli_starterkit_menu_access($menu, 'view', new AnonymousUserSession())->isAllowed());
    $this->assertFalse(blokkli_starterkit_menu_access($menu, 'view', $this->createUser())->isAllowed());
    $this->assertTrue(blokkli_starterkit_menu_access($menu, 'view', $this->createUser(['access toolbar']))->isAllowed());
  }

  /**
   * Other menus are left to core.
   */
  public function testOtherMenusAreNeutral(): void {
    $menu = $this->loadMenu('tools');
    $this->assertTrue(blokkli_starterkit_menu_access($menu, 'view', new AnonymousUserSession())->isNeutral());
  }

  /**
   * Paragraph types can be viewed by logged-in users only.
   */
  public function testParagraphTypesNeedLogin(): void {
    $type = ParagraphsType::load('button');
    $this->assertInstanceOf(ParagraphsType::class, $type);

    $this->assertTrue(blokkli_starterkit_paragraphs_type_access($type, 'view', $this->createUser())->isAllowed());
    $this->assertFalse(blokkli_starterkit_paragraphs_type_access($type, 'view', new AnonymousUserSession())->isAllowed());
    $this->assertTrue(blokkli_starterkit_paragraphs_type_access($type, 'update', $this->createUser())->isNeutral());
  }

  /**
   * Rokka metadata needs its view permission.
   *
   * The permission is not declared by any module, so only admin roles have it.
   */
  public function testRokkaMetadataNeedsPermission(): void {
    $entity = $this->loadMenu('main');

    $this->assertTrue(blokkli_starterkit_rokka_metadata_access($entity, 'view', $this->createUser([], NULL, TRUE))->isAllowed());
    $this->assertTrue(blokkli_starterkit_rokka_metadata_access($entity, 'view', $this->createUser())->isNeutral());
    $this->assertTrue(blokkli_starterkit_rokka_metadata_access($entity, 'view', new AnonymousUserSession())->isNeutral());
  }

  /**
   * Users see their own roles, not those of others.
   */
  public function testUsersSeeOnlyTheirOwnRoles(): void {
    $user = $this->createUser();
    $other = $this->createUser();

    $this->assertTrue($this->fieldAccess($user, 'roles', 'view', $user)->isAllowed());
    $this->assertFalse($this->fieldAccess($user, 'roles', 'view', $other)->isAllowed());
  }

  /**
   * Users edit their own email address, not that of others.
   */
  public function testUsersEditOnlyTheirOwnEmail(): void {
    $user = $this->createUser();
    $other = $this->createUser();

    $this->assertTrue($this->fieldAccess($user, 'mail', 'edit', $user)->isAllowed());
    $this->assertFalse($this->fieldAccess($user, 'mail', 'edit', $other)->isAllowed());
    $this->assertTrue($this->fieldAccess($user, 'mail', 'view', $user)->isNeutral());
  }

  /**
   * The user status field needs its view permission.
   *
   * The permission is not declared by any module, so only admin roles have it.
   */
  public function testUserStatusNeedsPermission(): void {
    $user = $this->createUser();

    $this->assertTrue($this->fieldAccess($user, 'status', 'view', $this->createUser([], NULL, TRUE))->isAllowed());
    $this->assertFalse($this->fieldAccess($user, 'status', 'view', $user)->isAllowed());
  }

  /**
   * Fields of other entity types are left to core.
   */
  public function testOtherEntityFieldsAreNeutral(): void {
    $node = $this->createContent(['type' => 'page', 'title' => $this->randomString()]);
    $items = $node->get('title');
    $result = blokkli_starterkit_entity_field_access('view', $items->getFieldDefinition(), $this->createUser(), $items);

    $this->assertTrue($result->isNeutral());
  }

  /**
   * Loads a menu that must exist on the site.
   */
  private function loadMenu(string $id): Menu {
    $menu = Menu::load($id);
    $this->assertInstanceOf(Menu::class, $menu, "Menu $id exists");
    return $menu;
  }

  /**
   * Runs the field access hook for a field of the given user.
   */
  private function fieldAccess(UserInterface $owner, string $field, string $operation, AccountInterface $account): AccessResultInterface {
    $items = $owner->get($field);
    return blokkli_starterkit_entity_field_access($operation, $items->getFieldDefinition(), $account, $items);
  }

}
