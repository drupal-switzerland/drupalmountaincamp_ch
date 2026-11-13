<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\blokkli_starterkit\Plugin\views\field\TranslationLinksViewsField;
use Drupal\KernelTests\KernelTestBase;
use Drupal\language\Entity\ConfigurableLanguage;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\node\NodeInterface;
use Drupal\Tests\user\Traits\UserCreationTrait;
use Drupal\views\ResultRow;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that the translation links follow the editor's access.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class TranslationLinksAccessTest extends KernelTestBase {

  use UserCreationTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'blokkli_starterkit',
    'content_translation',
    'field',
    'language',
    'node',
    'system',
    'text',
    'user',
    'views',
  ];

  /**
   * The English article, without a German translation.
   */
  private NodeInterface $node;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installEntitySchema('node');
    $this->installSchema('node', ['node_access']);
    $this->installConfig(['system', 'language', 'node']);
    ConfigurableLanguage::createFromLangcode('de')->save();
    NodeType::create(['type' => 'article', 'name' => 'Article'])->save();
    $this->container->get('content_translation.manager')->setEnabled('node', 'article', TRUE);
    $this->container->get('router.builder')->rebuild();
    // The first user is the administrator, who passes every access check.
    $this->createUser();

    $this->node = Node::create(['type' => 'article', 'title' => 'Article', 'langcode' => 'en']);
    $this->node->save();
  }

  /**
   * Renders the field for the article and returns the list items.
   */
  private function renderItems(): array {
    $field = TranslationLinksViewsField::create($this->container, [], 'translation_links_field', []);
    $row = new ResultRow();
    $row->_entity = $this->node;
    $build = $field->render($row);
    $this->assertContains('user.permissions', $build['#cache']['contexts']);
    return $build['#items'];
  }

  /**
   * A user who may not edit or translate gets the codes without links.
   */
  public function testNoLinksWithoutAccess(): void {
    $this->setUpCurrentUser([], ['access content']);

    $items = $this->renderItems();

    $this->assertSame(
      [['#plain_text' => 'en'], ['#plain_text' => 'de']],
      $items,
    );
  }

  /**
   * An editor who may edit and translate gets both links.
   */
  public function testLinksWithAccess(): void {
    $this->setUpCurrentUser([], [
      'access content',
      'edit any article content',
      'translate any entity',
      'create content translations',
    ]);

    $routes = array_map(fn (array $item) => $item['#url']->getRouteName(), $this->renderItems());

    $this->assertSame(['entity.node.edit_form', 'entity.node.content_translation_add'], $routes);
  }

}
