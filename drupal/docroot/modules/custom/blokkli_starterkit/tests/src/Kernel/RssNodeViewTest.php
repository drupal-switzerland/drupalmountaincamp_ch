<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Core\Entity\Entity\EntityViewDisplay;
use Drupal\Core\Entity\Entity\EntityViewMode;
use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that feed items don't repeat the node's title, author and date.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class RssNodeViewTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'blokkli_starterkit',
    'crop',
    'field',
    'file',
    'filter',
    'image',
    'media',
    'node',
    'rokka',
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
    $this->installConfig(['filter', 'node', 'system']);
    NodeType::create(['type' => 'press_release', 'name' => 'Press release'])->save();
    if (!EntityViewMode::load('node.rss')) {
      EntityViewMode::create(['id' => 'node.rss', 'targetEntityType' => 'node', 'label' => 'RSS'])->save();
    }
    foreach (['default', 'rss'] as $mode) {
      EntityViewDisplay::create([
        'targetEntityType' => 'node',
        'bundle' => 'press_release',
        'mode' => $mode,
        'status' => TRUE,
      ])->save();
    }
  }

  /**
   * The rss build drops title, author and date; other view modes keep them.
   */
  public function testRssBuildHasNoTitleAuthorOrDate(): void {
    $node = Node::create(['type' => 'press_release', 'title' => 'Feed item']);
    $node->save();
    $view_builder = $this->container->get('entity_type.manager')->getViewBuilder('node');

    $rss = $view_builder->build($view_builder->view($node, 'rss'));
    $default = $view_builder->build($view_builder->view($node, 'default'));

    foreach (['title', 'uid', 'created'] as $field) {
      $this->assertArrayNotHasKey($field, $rss, "rss build has no $field");
      $this->assertArrayHasKey($field, $default, "default build keeps $field");
    }
  }

}
