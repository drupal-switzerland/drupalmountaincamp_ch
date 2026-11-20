<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Core\Form\FormState;
use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\path_alias\Entity\PathAlias;
use Drupal\redirect\Entity\Redirect;
use Drupal\Tests\user\Traits\UserCreationTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\Attributes\TestWith;

/**
 * Tests that the redirect form refuses a target that is an unpublished page.
 *
 * The forms are submitted as an editor submits them, with the target typed
 * into the field.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class RedirectFormUnpublishedTargetTest extends KernelTestBase {

  use UserCreationTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    // This module's widget alter calls a function of allowed_formats.
    'allowed_formats',
    'blokkli_starterkit',
    'field',
    'link',
    'node',
    'path_alias',
    'redirect',
    'system',
    'text',
    'user',
    'views',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installEntitySchema('node');
    $this->installEntitySchema('path_alias');
    $this->installEntitySchema('redirect');
    $this->installSchema('node', ['node_access']);
    $this->installConfig(['system', 'node', 'redirect']);
    NodeType::create(['type' => 'page', 'name' => 'Page'])->save();
    // The link field refuses a target its editor cannot open, so the editor
    // can see unpublished pages, as the site's editors can.
    $this->setUpCurrentUser([], ['access content', 'administer redirects', 'bypass node access']);
  }

  /**
   * A new redirect to an unpublished page is refused, by number or address.
   */
  #[TestWith(['/node/%d'])]
  #[TestWith(['/launch-page'])]
  #[TestWith(['/launch-page?ref=newsletter'])]
  #[TestWith(['Launch page (%d)'])]
  public function testNewRedirectToUnpublishedPageIsRefused(string $typed): void {
    $node = $this->createPage('Launch page', FALSE, '/launch-page');

    $errors = $this->submitRedirectForm(Redirect::create(), 'tickets', sprintf($typed, $node->id()));

    $this->assertArrayHasKey('redirect_redirect', $errors);
    $this->assertStringStartsWith('This page is not published', (string) $errors['redirect_redirect']);
    $this->assertSame([], Redirect::loadMultiple());
  }

  /**
   * A new redirect to a published page is saved.
   */
  #[TestWith(['/node/%d'])]
  #[TestWith(['/launch-page'])]
  public function testNewRedirectToPublishedPageIsSaved(string $typed): void {
    $node = $this->createPage('Launch page', TRUE, '/launch-page');

    $errors = $this->submitRedirectForm(Redirect::create(), 'tickets', sprintf($typed, $node->id()));

    $this->assertSame([], $errors);
    $this->assertCount(1, Redirect::loadMultiple());
  }

  /**
   * An edit that points a redirect at an unpublished page is refused.
   */
  public function testEditToUnpublishedPageIsRefused(): void {
    $published = $this->createPage('Programme', TRUE, '/programme');
    $this->createPage('Launch page', FALSE, '/launch-page');
    $redirect = $this->createRedirect('tickets', 'node/' . $published->id());

    $errors = $this->submitRedirectForm($redirect, 'tickets', '/launch-page');

    $this->assertArrayHasKey('redirect_redirect', $errors);
    $stored = Redirect::load($redirect->id());
    $this->assertSame('internal:/node/' . $published->id(), $stored->getRedirect()['uri']);
  }

  /**
   * An edit that keeps the target is saved, as the rule keeps such a redirect.
   *
   * A page unpublished without a rename keeps its redirects.
   */
  public function testEditKeepingTheTargetOfAnUnpublishedPageIsSaved(): void {
    $node = $this->createPage('Programme', TRUE, '/programme');
    $redirect = $this->createRedirect('tickets', 'node/' . $node->id());
    $node->setUnpublished()->save();

    $errors = $this->submitRedirectForm($redirect, 'tickets', '/node/' . $node->id(), 302);

    $this->assertSame([], $errors);
    $this->assertSame(302, (int) Redirect::load($redirect->id())->getStatusCode());
  }

  /**
   * Submits the add or edit form of a redirect and returns the form errors.
   *
   * @return array<string, \Drupal\Core\StringTranslation\TranslatableMarkup|string>
   *   The errors, keyed by element.
   */
  private function submitRedirectForm(Redirect $redirect, string $source, string $typed_target, int $status_code = 301): array {
    $operation = $redirect->isNew() ? 'default' : 'edit';
    $form_object = $this->container->get('entity_type.manager')
      ->getFormObject('redirect', $operation)
      ->setEntity($redirect);
    $form_state = (new FormState())->setValues([
      'redirect_source' => [['path' => $source]],
      'redirect_redirect' => [['uri' => $typed_target]],
      'status_code' => $status_code,
      'language' => [['value' => 'und']],
      'op' => 'Save',
    ]);
    $this->container->get('form_builder')->submitForm($form_object, $form_state);
    return $form_state->getErrors();
  }

  /**
   * Creates a saved page with an address.
   */
  private function createPage(string $title, bool $published, string $alias): Node {
    $node = Node::create(['type' => 'page', 'title' => $title, 'status' => (int) $published]);
    $node->save();
    PathAlias::create(['path' => '/node/' . $node->id(), 'alias' => $alias, 'langcode' => 'und'])->save();
    return $node;
  }

  /**
   * Creates a saved redirect for all languages.
   */
  private function createRedirect(string $source, string $target): Redirect {
    $redirect = Redirect::create();
    $redirect->setSource($source);
    $redirect->setRedirect($target);
    $redirect->setLanguage('und');
    $redirect->setStatusCode(301);
    $redirect->save();
    return $redirect;
  }

}
