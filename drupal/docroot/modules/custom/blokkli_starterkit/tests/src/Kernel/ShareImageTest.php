<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Component\Serialization\Yaml;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\file\Entity\File;
use Drupal\image\Entity\ImageStyle;
use Drupal\KernelTests\KernelTestBase;
use Drupal\media\Entity\Media;
use Drupal\metatag\Entity\MetatagDefaults;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\Tests\media\Traits\MediaTypeCreationTrait;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the share image tags of news and pages with the exported config.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class ShareImageTest extends KernelTestBase {

  use MediaTypeCreationTrait;

  private const CONFIG_DIRECTORY = DRUPAL_ROOT . '/../config/default';

  private const DEFAULT_IMAGE = 'https://drupalmountaincamp.ch/images/mountain-camp-og-1200x630.jpg';

  private const WIDTH = '1200';

  private const HEIGHT = '630';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'crop',
    'datetime',
    'field',
    'file',
    'focal_point',
    'image',
    'media',
    'metatag',
    'metatag_open_graph',
    'metatag_twitter_cards',
    'node',
    'schema_article',
    'schema_metatag',
    'system',
    'text',
    'token',
    'token_or',
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
    $this->installEntitySchema('crop');
    $this->installSchema('file', ['file_usage']);
    $this->installConfig(['node', 'system', 'field', 'image', 'media', 'focal_point']);

    $this->createMediaType('image', ['id' => 'image']);
    FieldStorageConfig::create([
      'field_name' => 'field_image',
      'entity_type' => 'node',
      'type' => 'entity_reference',
      'settings' => ['target_type' => 'media'],
    ])->save();
    foreach (['press_release' => 'News', 'page' => 'Page'] as $type => $name) {
      NodeType::create(['type' => $type, 'name' => $name])->save();
      FieldConfig::create([
        'field_name' => 'field_image',
        'entity_type' => 'node',
        'bundle' => $type,
      ])->save();
    }

    ImageStyle::create($this->exportedConfig('image.style.share'))->save();
    // The chain metatag merges for news and pages.
    foreach (['global', 'node', 'node__press_release', 'node__page'] as $id) {
      MetatagDefaults::create($this->exportedConfig("metatag.metatag_defaults.$id"))->save();
    }
  }

  /**
   * News and pages share the resized image, with its size and its alt text.
   */
  #[DataProvider('nodeTypes')]
  public function testImageIsSharedInTheShareStyle(string $type): void {
    $tags = $this->shareImageTags($type, 'public://media/images/keynote.jpg');

    $this->assertStringContainsString('/styles/share/public/media/images/keynote.jpg', $tags['og_image_0']);
    $this->assertStringContainsString('itok=', $tags['og_image_0']);
    $this->assertStringStartsWith('http', $tags['og_image_0']);
    $this->assertSame(self::WIDTH, $tags['og_image_width']);
    $this->assertSame(self::HEIGHT, $tags['og_image_height']);
    $this->assertSame('What the picture shows', $tags['og_image_alt']);
  }

  /**
   * An old PNG upload with a space in its name is shared as a JPEG.
   */
  public function testPngIsSharedAsJpeg(): void {
    $tags = $this->shareImageTags('press_release', 'public://field/image/image 360.png');

    $this->assertStringContainsString('/styles/share/public/field/image/image%20360.png.jpg?', $tags['og_image_0']);
    $this->assertSame(self::WIDTH, $tags['og_image_width']);
    $this->assertSame(self::HEIGHT, $tags['og_image_height']);
  }

  /**
   * A JPEG keeps its share URL; only the .jpeg spelling gains .jpg.
   */
  #[DataProvider('jpegPaths')]
  public function testJpegShareUrl(string $uri, string $expected): void {
    $tags = $this->shareImageTags('press_release', $uri);

    $this->assertStringContainsString($expected, $tags['og_image_0']);
  }

  /**
   * JPEG sources and the share URL each gets.
   *
   * @return array<string, array{string, string}>
   *   Source URI and expected URL part per case.
   */
  public static function jpegPaths(): array {
    return [
      'jpg' => ['public://media/images/keynote.jpg', '/styles/share/public/media/images/keynote.jpg?'],
      'jpeg' => ['public://field/image/keynotes.jpeg', '/styles/share/public/field/image/keynotes.jpeg.jpg?'],
    ];
  }

  /**
   * Without an image, the default share image goes out with its own size.
   */
  #[DataProvider('nodeTypes')]
  public function testDefaultImageWithoutAnImage(string $type): void {
    $tags = $this->shareImageTags($type, NULL);

    $this->assertSame(self::DEFAULT_IMAGE, $tags['og_image_0']);
    $this->assertSame(self::WIDTH, $tags['og_image_width']);
    $this->assertSame(self::HEIGHT, $tags['og_image_height']);
    $this->assertArrayNotHasKey('og_image_alt', $tags);
    $this->assertArrayNotHasKey('og_image_1', $tags);
  }

  /**
   * The node types that have a share image.
   *
   * @return array<string, array{string}>
   *   Node type per case.
   */
  public static function nodeTypes(): array {
    return ['news' => ['press_release'], 'page' => ['page']];
  }

  /**
   * The og:image tags Drupal renders for a node.
   *
   * @param string $type
   *   The node type.
   * @param string|null $image_uri
   *   URI of the node's image, or NULL for a node without one.
   *
   * @return array<string, string>
   *   Tag content by tag name.
   */
  private function shareImageTags(string $type, ?string $image_uri): array {
    $values = ['type' => $type, 'title' => 'A title'];
    if ($image_uri !== NULL) {
      $file = File::create(['uri' => $image_uri]);
      $file->save();
      $media = Media::create([
        'bundle' => 'image',
        'name' => 'Picture',
        'field_media_image' => [
          'target_id' => $file->id(),
          'alt' => 'What the picture shows',
          'width' => 3237,
          'height' => 1784,
        ],
      ]);
      $media->save();
      $values['field_image'] = $media->id();
    }
    $node = Node::create($values);
    $node->save();

    $manager = $this->container->get('metatag.manager');
    $elements = $manager->generateRawElements($manager->tagsFromEntityWithDefaults($node), $node);
    $tags = [];
    foreach ($elements as $name => $element) {
      if (str_starts_with($name, 'og_image')) {
        $tags[$name] = (string) $element['#attributes']['content'];
      }
    }
    return $tags;
  }

  /**
   * Reads a config object from the site's exported configuration.
   *
   * @return array<string, mixed>
   *   The config data.
   */
  private function exportedConfig(string $name): array {
    return Yaml::decode((string) file_get_contents(self::CONFIG_DIRECTORY . "/$name.yml"));
  }

}
