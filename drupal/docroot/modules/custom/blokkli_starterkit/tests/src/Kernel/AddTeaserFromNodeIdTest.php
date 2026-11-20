<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\paragraphs\Entity\ParagraphsType;
use Drupal\paragraphs_blokkli\Exception\MutationAccessException;
use Drupal\paragraphs_blokkli\Exception\MutationMissingEntityException;
use Drupal\paragraphs_blokkli\ParagraphMutationContextInterface;
use Drupal\Tests\user\Traits\UserCreationTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that a teaser is added only for a node the editor may view.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class AddTeaserFromNodeIdTest extends KernelTestBase {

  use UserCreationTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'bca',
    'blokkli_starterkit',
    'entity_reference_revisions',
    'field',
    'file',
    'filter',
    'node',
    'paragraphs',
    'paragraphs_blokkli',
    'paragraphs_blokkli_search',
    'system',
    'text',
    'user',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installEntitySchema('node');
    $this->installEntitySchema('paragraph');
    $this->installSchema('node', ['node_access']);
    $this->installConfig(['filter', 'node', 'system']);
    NodeType::create(['type' => 'article', 'name' => 'Article'])->save();
    ParagraphsType::create(['id' => 'teaser', 'label' => 'Teaser'])->save();
    // The first user is the administrator, who passes every access check.
    $this->createUser();
  }

  /**
   * Runs the mutation for a node ID as a first run and returns the proxies.
   *
   * @return array
   *   The proxies the mutation added.
   */
  private function runMutation(string $nid): array {
    $added = [];
    $context = $this->createMock(ParagraphMutationContextInterface::class);
    $context->method('addProxy')->willReturnCallback(
      function ($proxy) use (&$added): void {
        $added[] = $proxy;
      },
    );
    $mutation = $this->container->get('plugin.manager.paragraph_mutation')
      ->createInstance('add_teaser_from_node_id', ['is_first_run' => TRUE]);
    $mutation->execute($context, $nid, 'node', 'host-uuid', 'field_paragraphs', NULL);
    return $added;
  }

  /**
   * Creates an article node.
   */
  private function createArticle(bool $published): Node {
    $node = Node::create([
      'type' => 'article',
      'title' => 'Article',
      'status' => $published,
    ]);
    $node->save();
    return $node;
  }

  /**
   * A node the editor may view is added as a teaser.
   */
  public function testViewableNodeIsAdded(): void {
    $this->setUpCurrentUser([], ['access content']);
    $node = $this->createArticle(TRUE);

    $this->assertCount(1, $this->runMutation((string) $node->id()));
  }

  /**
   * An unpublished node the editor may not view is refused.
   */
  public function testUnviewableNodeIsRefused(): void {
    $this->setUpCurrentUser([], ['access content']);
    $node = $this->createArticle(FALSE);

    $this->expectException(MutationAccessException::class);
    $this->runMutation((string) $node->id());
  }

  /**
   * A node ID that does not exist is refused.
   */
  public function testMissingNodeIsRefused(): void {
    $this->setUpCurrentUser([], ['access content']);

    $this->expectException(MutationMissingEntityException::class);
    $this->runMutation('999');
  }

}
