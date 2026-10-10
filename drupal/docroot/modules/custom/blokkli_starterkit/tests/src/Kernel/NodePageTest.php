<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\blokkli_starterkit\Entity\Node\NodePage;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\KernelTests\KernelTestBase;
use Drupal\media\Entity\Media;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\Tests\media\Traits\MediaTypeCreationTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the bundle class of page nodes.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class NodePageTest extends KernelTestBase {

  use MediaTypeCreationTrait;

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'bca',
    'blokkli_starterkit',
    'crop',
    'entity_reference_revisions',
    'field',
    'file',
    'filter',
    'image',
    'media',
    'node',
    'paragraphs',
    'paragraphs_blokkli',
    'paragraphs_blokkli_search',
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
    $this->installEntitySchema('file');
    $this->installEntitySchema('media');
    $this->installSchema('file', ['file_usage']);
    $this->installConfig(['filter', 'node', 'system', 'field', 'image', 'media']);

    NodeType::create(['type' => 'page', 'name' => 'Page'])->save();
    NodeType::create(['type' => 'press_release', 'name' => 'Press release'])->save();
    $this->createMediaType('image', ['id' => 'image']);
    FieldStorageConfig::create([
      'field_name' => 'field_image',
      'entity_type' => 'node',
      'type' => 'entity_reference',
      'settings' => ['target_type' => 'media'],
      'cardinality' => -1,
    ])->save();
    FieldConfig::create([
      'field_name' => 'field_image',
      'entity_type' => 'node',
      'bundle' => 'page',
    ])->save();
  }

  /**
   * Creates a saved media item.
   */
  private function createMedia(string $name): Media {
    $media = Media::create(['bundle' => 'image', 'name' => $name]);
    $media->save();
    return $media;
  }

  /**
   * Page nodes use the bundle class, other node types do not.
   */
  public function testPageNodesUseTheBundleClass(): void {
    $this->assertInstanceOf(NodePage::class, Node::create(['type' => 'page', 'title' => 'Page']));
    $this->assertNotInstanceOf(NodePage::class, Node::create(['type' => 'press_release', 'title' => 'News']));
  }

  /**
   * The search thumbnail is the first image of the page.
   */
  public function testThumbnailIsTheFirstImage(): void {
    $first = $this->createMedia('First');
    $second = $this->createMedia('Second');
    $page = Node::create(['type' => 'page', 'title' => 'Page', 'field_image' => [$first->id(), $second->id()]]);
    $page->save();

    $thumbnail = Node::load($page->id())->getBlokkliThumbnailMedia();
    $this->assertNotNull($thumbnail);
    $this->assertSame($first->id(), $thumbnail->id());
  }

  /**
   * A page without an image, or whose image was deleted, has no thumbnail.
   */
  public function testNoThumbnailWithoutAnImage(): void {
    $page = Node::create(['type' => 'page', 'title' => 'Page']);
    $page->save();
    $this->assertNull($page->getBlokkliThumbnailMedia());

    $media = $this->createMedia('Gone');
    $withDeletedImage = Node::create(['type' => 'page', 'title' => 'Page', 'field_image' => [$media->id()]]);
    $withDeletedImage->save();
    $media->delete();

    $this->assertNull(Node::load($withDeletedImage->id())->getBlokkliThumbnailMedia());
  }

}
