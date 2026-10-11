<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Component\Serialization\Yaml;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\file\Entity\File;
use Drupal\KernelTests\KernelTestBase;
use Drupal\media\Entity\Media;
use Drupal\metatag\Entity\MetatagDefaults;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\schema_metatag\SchemaMetatagManager;
use Drupal\Tests\media\Traits\MediaTypeCreationTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the structured data of news articles with the exported defaults.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class PressReleaseStructuredDataTest extends KernelTestBase {

  use MediaTypeCreationTrait;

  private const CONFIG_DIRECTORY = DRUPAL_ROOT . '/../config/default';

  private const ORGANISATION = 'Drupal Events Switzerland';

  private const PUBLISHED = '2026-03-06';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'datetime',
    'field',
    'file',
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
    $this->installSchema('file', ['file_usage']);
    $this->installConfig(['node', 'system', 'field', 'image', 'media']);

    NodeType::create(['type' => 'press_release', 'name' => 'Press release'])->save();
    $this->createMediaType('image', ['id' => 'image']);
    $fields = [
      'field_date' => ['type' => 'datetime', 'settings' => ['datetime_type' => 'date']],
      'field_image' => ['type' => 'entity_reference', 'settings' => ['target_type' => 'media']],
    ];
    foreach ($fields as $field_name => $storage) {
      FieldStorageConfig::create(['field_name' => $field_name, 'entity_type' => 'node'] + $storage)->save();
      FieldConfig::create([
        'field_name' => $field_name,
        'entity_type' => 'node',
        'bundle' => 'press_release',
      ])->save();
    }

    // The chain metatag merges for a news article.
    foreach (['global', 'node', 'node__press_release'] as $id) {
      MetatagDefaults::create($this->exportedConfig("metatag.metatag_defaults.$id"))->save();
    }
  }

  /**
   * An article is a NewsArticle with its title, date, URL and organisation.
   */
  public function testArticleHasNewsArticleData(): void {
    $node = $this->createArticle('Keynotes confirmed');

    $article = $this->newsArticle($node);

    $this->assertSame('NewsArticle', $article['@type']);
    $this->assertSame('Keynotes confirmed', $article['headline']);
    $this->assertSame(self::PUBLISHED, $article['datePublished']);
    $this->assertSame($node->toUrl()->setAbsolute()->toString(), $article['mainEntityOfPage']);
    foreach (['author', 'publisher'] as $role) {
      $this->assertSame('Organization', $article[$role]['@type']);
      $this->assertSame(self::ORGANISATION, $article[$role]['name']);
      $this->assertStringStartsWith('http', $article[$role]['url']);
    }
  }

  /**
   * The Open Graph published time is the same date.
   */
  public function testPublishedTimeMatchesTheStructuredData(): void {
    $elements = $this->elements($this->createArticle('Keynotes confirmed'));

    $this->assertSame(self::PUBLISHED, $elements['article_published_time']['#attributes']['content']);
  }

  /**
   * No modified date is sent: a node's changed time is not an editorial one.
   */
  public function testArticleStatesNoModifiedDate(): void {
    $node = $this->createArticle('Keynotes confirmed');

    $this->assertArrayNotHasKey('dateModified', $this->newsArticle($node));
    $this->assertArrayNotHasKey('article_modified_time', $this->elements($node));
  }

  /**
   * An article with an image names it by absolute URL.
   */
  public function testArticleImageIsAnAbsoluteUrl(): void {
    $file = File::create(['uri' => 'public://keynote.jpg']);
    $file->save();
    $media = Media::create(['bundle' => 'image', 'name' => 'Keynote', 'field_media_image' => $file->id()]);
    $media->save();

    $article = $this->newsArticle($this->createArticle('Keynotes confirmed', ['field_image' => $media->id()]));

    $this->assertSame('ImageObject', $article['image']['@type']);
    $this->assertMatchesRegularExpression('#^https?://.+/keynote\.jpg$#', $article['image']['url']);
  }

  /**
   * Without an image there is no image property, and nothing is empty.
   */
  public function testArticleWithoutImageHasNoEmptyProperty(): void {
    $article = $this->newsArticle($this->createArticle('Keynotes confirmed'));

    $this->assertArrayNotHasKey('image', $article);
    array_walk_recursive($article, function ($value, $key): void {
      $this->assertNotSame('', $value, "$key is empty");
    });
  }

  /**
   * Markup in a title cannot end the script element that holds the JSON.
   */
  public function testTitleMarkupCannotLeaveTheScriptElement(): void {
    $json = $this->jsonLd($this->createArticle('Break </script><script>alert(1)</script> <!-- out'));

    $this->assertStringNotContainsString('<', $json);
    $this->assertStringStartsWith('Break', json_decode($json, TRUE)['@graph'][0]['headline']);
  }

  /**
   * Creates a saved news article.
   *
   * @param string $title
   *   The title.
   * @param array<string, mixed> $values
   *   Further field values.
   */
  private function createArticle(string $title, array $values = []): Node {
    $node = Node::create($values + [
      'type' => 'press_release',
      'title' => $title,
      'field_date' => self::PUBLISHED,
    ]);
    $node->save();
    return $node;
  }

  /**
   * The meta tag elements Drupal renders for a node.
   *
   * @return array<string, array<string, mixed>>
   *   Render elements by tag name.
   */
  private function elements(Node $node): array {
    $manager = $this->container->get('metatag.manager');
    return $manager->generateRawElements($manager->tagsFromEntityWithDefaults($node), $node);
  }

  /**
   * The JSON-LD string built from a node's tags, as the GraphQL field does.
   */
  private function jsonLd(Node $node): string {
    $head = [];
    foreach ($this->elements($node) as $name => $element) {
      $head[] = [$element, $name];
    }
    return SchemaMetatagManager::encodeJsonld(SchemaMetatagManager::parseJsonld($head));
  }

  /**
   * The single item of a node's JSON-LD graph.
   *
   * @return array<string, mixed>
   *   The decoded item.
   */
  private function newsArticle(Node $node): array {
    $graph = json_decode($this->jsonLd($node), TRUE)['@graph'];
    $this->assertCount(1, $graph);
    return $graph[0];
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
