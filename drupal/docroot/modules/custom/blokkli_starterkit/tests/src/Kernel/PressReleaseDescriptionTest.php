<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Component\Serialization\Yaml;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\filter\Entity\FilterFormat;
use Drupal\KernelTests\KernelTestBase;
use Drupal\metatag\Entity\MetatagDefaults;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the description tags of news articles with the exported defaults.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class PressReleaseDescriptionTest extends KernelTestBase {

  private const CONFIG_DIRECTORY = DRUPAL_ROOT . '/../config/default';

  private const TEXT_FORMAT = 'markup';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'field',
    'filter',
    'metatag',
    'metatag_open_graph',
    'metatag_twitter_cards',
    'node',
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
    $this->installConfig(['filter', 'node', 'system']);

    // A format without filters, so markup reaches the token as editors' rich
    // text does.
    FilterFormat::create(['format' => self::TEXT_FORMAT, 'name' => 'Markup'])->save();
    NodeType::create(['type' => 'press_release', 'name' => 'Press release'])->save();
    foreach (['field_teaser', 'field_lead'] as $field_name) {
      FieldStorageConfig::create([
        'field_name' => $field_name,
        'entity_type' => 'node',
        'type' => 'text_long',
      ])->save();
      FieldConfig::create([
        'field_name' => $field_name,
        'entity_type' => 'node',
        'bundle' => 'press_release',
      ])->save();
    }

    $this->config('metatag.settings')
      ->setData($this->exportedConfig('metatag.settings'))
      ->save();
    // The chain metatag merges for a news article.
    foreach (['global', 'node', 'node__press_release'] as $id) {
      MetatagDefaults::create($this->exportedConfig("metatag.metatag_defaults.$id"))->save();
    }
  }

  /**
   * Without a teaser, both description tags are the lead.
   */
  public function testLeadIsTheDescriptionWithoutTeaser(): void {
    $tags = $this->descriptionTags(['field_lead' => 'The lead of the article.']);

    $this->assertSame('The lead of the article.', $tags['description']);
    $this->assertSame('The lead of the article.', $tags['og_description']);
  }

  /**
   * A teaser wins over the lead.
   */
  public function testTeaserWinsOverLead(): void {
    $tags = $this->descriptionTags([
      'field_teaser' => 'The teaser.',
      'field_lead' => 'The lead of the article.',
    ]);

    $this->assertSame('The teaser.', $tags['description']);
    $this->assertSame('The teaser.', $tags['og_description']);
  }

  /**
   * A long lead with markup becomes plain text, trimmed as configured.
   */
  public function testLongLeadWithMarkupIsPlainTrimmedText(): void {
    $sentence = 'Drupal Mountain Camp brings <strong>experts</strong> and <a href="/news">newcomers</a> together. ';
    $lead = '<p>' . trim(str_repeat($sentence, 5)) . '</p>';
    $max_length = $this->exportedConfig('metatag.settings')['tag_trim_maxlength']['metatag_maxlength_description'];

    $tags = $this->descriptionTags(['field_lead' => $lead]);

    foreach ($tags as $content) {
      $this->assertSame(strip_tags($content), $content);
      $this->assertStringStartsWith('Drupal Mountain Camp brings experts and newcomers together.', $content);
    }
    $this->assertGreaterThan($max_length, mb_strlen(strip_tags($lead)));
    $this->assertLessThan(mb_strlen(strip_tags($lead)), mb_strlen($tags['description']));
  }

  /**
   * With neither field, Drupal sends no description tags.
   */
  public function testNoDescriptionWithoutTeaserAndLead(): void {
    $this->assertSame([], $this->descriptionTags([]));
  }

  /**
   * The content of the description tags Drupal renders for a news article.
   *
   * @param array<string, string> $texts
   *   Field values by field name.
   *
   * @return array<string, string>
   *   Tag content by tag name, for the description tags that are rendered.
   */
  private function descriptionTags(array $texts): array {
    $values = ['type' => 'press_release', 'title' => 'An article'];
    foreach ($texts as $field_name => $text) {
      $values[$field_name] = ['value' => $text, 'format' => self::TEXT_FORMAT];
    }
    $node = Node::create($values);
    $node->save();

    $manager = $this->container->get('metatag.manager');
    $elements = $manager->generateRawElements($manager->tagsFromEntityWithDefaults($node), $node);

    $tags = [];
    foreach (['description', 'og_description'] as $name) {
      if (isset($elements[$name])) {
        $tags[$name] = (string) $elements[$name]['#attributes']['content'];
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
