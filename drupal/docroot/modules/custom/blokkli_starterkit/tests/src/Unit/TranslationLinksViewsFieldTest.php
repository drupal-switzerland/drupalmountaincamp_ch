<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Unit;

use Drupal\block_content\BlockContentInterface;
use Drupal\blokkli_starterkit\Plugin\views\field\TranslationLinksViewsField;
use Drupal\Core\Language\Language;
use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Url;
use Drupal\node\NodeInterface;
use Drupal\rest\Plugin\views\display\RestExport;
use Drupal\Tests\UnitTestCase;
use Drupal\user\UserInterface;
use Drupal\views\ResultRow;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the translation links column of the admin content views.
 */
#[CoversClass(TranslationLinksViewsField::class)]
#[Group('blokkli_starterkit')]
class TranslationLinksViewsFieldTest extends UnitTestCase {

  /**
   * Builds the field for a site with English, German and French.
   */
  private function createField(): TranslationLinksViewsField {
    $languageManager = $this->createMock(LanguageManagerInterface::class);
    $languageManager->method('getLanguages')->willReturn([
      'en' => new Language(['id' => 'en', 'name' => 'English']),
      'de' => new Language(['id' => 'de', 'name' => 'German']),
      'fr' => new Language(['id' => 'fr', 'name' => 'French']),
    ]);
    $field = new TranslationLinksViewsField([], 'translation_links_field', [], $languageManager);
    $field->setStringTranslation($this->getStringTranslationStub());
    return $field;
  }

  /**
   * Creates an English node 7 with the given translations.
   */
  private function createNode(array $translations, bool $translatable = TRUE): NodeInterface {
    $node = $this->createMock(NodeInterface::class);
    $node->method('getEntityTypeId')->willReturn('node');
    $node->method('id')->willReturn('7');
    $node->method('language')->willReturn(new Language(['id' => 'en', 'name' => 'English']));
    $node->method('isTranslatable')->willReturn($translatable);
    $node->method('hasTranslation')->willReturnCallback(fn (string $langcode) => in_array($langcode, $translations, TRUE));
    return $node;
  }

  /**
   * Renders the field for an entity.
   */
  private function render(TranslationLinksViewsField $field, object $entity): array|string {
    $row = new ResultRow();
    $row->_entity = $entity;
    return $field->render($row);
  }

  /**
   * Returns the link of one language from a rendered list.
   */
  private function link(array $build, string $langcode): array {
    foreach ($build['#items'] as $item) {
      if ($item['#title'] === $langcode) {
        return $item;
      }
    }
    $this->fail("No link for $langcode.");
  }

  /**
   * One link per site language, in the order of the languages.
   */
  public function testListsEveryLanguage(): void {
    $build = $this->render($this->createField(), $this->createNode(['en', 'de']));

    $this->assertSame('item_list', $build['#theme']);
    $this->assertSame(['en', 'de', 'fr'], array_column($build['#items'], '#title'));
  }

  /**
   * An existing translation links to its edit form in that language.
   */
  public function testExistingTranslationLinksToItsEditForm(): void {
    $link = $this->link($this->render($this->createField(), $this->createNode(['en', 'de'])), 'de');

    $this->assertInstanceOf(Url::class, $link['#url']);
    $this->assertSame('entity.node.edit_form', $link['#url']->getRouteName());
    $this->assertSame(['node' => '7'], $link['#url']->getRouteParameters());
    $this->assertSame('de', $link['#url']->getOption('language')->getId());
    $this->assertSame('Edit: German', $link['#attributes']['title']);
    $this->assertSame(['views-liip-links-item'], $link['#attributes']['class']);
  }

  /**
   * The original language is marked as the source.
   */
  public function testSourceLanguageIsMarked(): void {
    $link = $this->link($this->render($this->createField(), $this->createNode(['en', 'de'])), 'en');

    $this->assertSame('entity.node.edit_form', $link['#url']->getRouteName());
    $this->assertContains('is-source', $link['#attributes']['class']);
    $this->assertSame('Edit: English (Original language)', $link['#attributes']['title']);
  }

  /**
   * A missing translation links to adding it from the source language.
   */
  public function testMissingTranslationLinksToAddingIt(): void {
    $link = $this->link($this->render($this->createField(), $this->createNode(['en', 'de'])), 'fr');

    $this->assertSame('entity.node.content_translation_add', $link['#url']->getRouteName());
    $this->assertSame(['source' => 'en', 'target' => 'fr', 'node' => '7'], $link['#url']->getRouteParameters());
    $this->assertSame('fr', $link['#url']->getOption('language')->getId());
    $this->assertContains('is-missing', $link['#attributes']['class']);
    $this->assertNotContains('is-source', $link['#attributes']['class']);
    $this->assertSame('Add: French', $link['#attributes']['title']);
  }

  /**
   * Content that cannot be translated says so instead of offering links.
   */
  public function testUntranslatableContentHasNoLinks(): void {
    $build = $this->render($this->createField(), $this->createNode(['en'], FALSE));

    $this->assertSame('Not translatable', (string) $build['#markup']);
    $this->assertArrayNotHasKey('#items', $build);
  }

  /**
   * A REST export gets the existing language codes as plain text.
   */
  public function testRestExportListsExistingLanguageCodes(): void {
    $field = $this->createField();
    $field->displayHandler = $this->createMock(RestExport::class);

    $this->assertSame('en|de', $this->render($field, $this->createNode(['en', 'de'])));
    $this->assertSame('en', $this->render($field, $this->createNode(['en'], FALSE)));
  }

  /**
   * Blocks that live inside one page show a dash: they have no own form.
   */
  public function testNonReusableBlockShowsDash(): void {
    $block = $this->createMock(BlockContentInterface::class);
    $block->method('isReusable')->willReturn(FALSE);

    $this->assertSame(['#markup' => '-'], $this->render($this->createField(), $block));
  }

  /**
   * Entity types without translation routes render nothing.
   */
  public function testOtherEntityTypesRenderNothing(): void {
    $this->assertSame([], $this->render($this->createField(), $this->createMock(UserInterface::class)));
  }

  /**
   * The column is computed and adds nothing to the query.
   */
  public function testAddsNothingToTheQuery(): void {
    $field = $this->createField();
    $field->query();

    $this->assertFalse($field->usesGroupBy());
    $this->assertNull($field->query);
  }

}
