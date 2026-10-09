<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\language\Entity\ConfigurableLanguage;
use Drupal\texts\TextsInterface;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests blokkli_starterkit_post_update_english_text_defaults().
 */
#[Group('blokkli_starterkit')]
class EnglishTextDefaultsUpdateTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'content_translation',
    'language',
    'locale',
    'options',
    'system',
    'texts',
    'user',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('texts');
    $this->installEntitySchema('user');
    require_once __DIR__ . '/../../../blokkli_starterkit.post_update.php';
  }

  /**
   * Creates an English text with the given value.
   */
  private function createText(string $key, string $context, string $value): TextsInterface {
    $text = $this->container->get('entity_type.manager')->getStorage('texts')->create([
      'key' => $key,
      'context' => $context,
      'translation' => $value,
      'langcode' => 'en',
    ]);
    $text->save();
    return $text;
  }

  /**
   * Reloads a text from storage.
   */
  private function reload(TextsInterface $text): TextsInterface {
    $storage = $this->container->get('entity_type.manager')->getStorage('texts');
    $storage->resetCache();
    return $storage->load($text->id());
  }

  /**
   * A German default becomes English and stays the German translation.
   */
  public function testReplacesGermanDefault(): void {
    ConfigurableLanguage::createFromLangcode('de')->save();
    $text = $this->reload($this->createText('menu', 'default', 'Menü'));
    blokkli_starterkit_post_update_english_text_defaults();

    $text = $this->reload($text);
    $this->assertSame('Menu', $text->getTranslation('en')->getTranslationText());
    $this->assertSame('Menü', $text->getTranslation('de')->getTranslationText());
  }

  /**
   * Edited English texts and existing German translations are kept.
   */
  public function testKeepsEditedTexts(): void {
    ConfigurableLanguage::createFromLangcode('de')->save();
    $edited = $this->createText('prev', 'slides', 'Back');
    $translated = $this->createText('next', 'slides', 'Nächste');
    $translated->addTranslation('de', ['translation' => 'Weiter'])->save();

    blokkli_starterkit_post_update_english_text_defaults();

    $this->assertSame('Back', $this->reload($edited)->getTranslation('en')->getTranslationText());
    $translated = $this->reload($translated);
    $this->assertSame('Next', $translated->getTranslation('en')->getTranslationText());
    $this->assertSame('Weiter', $translated->getTranslation('de')->getTranslationText());
  }

  /**
   * Without German, only the English text changes.
   */
  public function testEnglishOnlySite(): void {
    $text = $this->createText('ctaButton', 'search', 'Suchen');

    blokkli_starterkit_post_update_english_text_defaults();

    $text = $this->reload($text);
    $this->assertSame('Search', $text->getTranslation('en')->getTranslationText());
    $this->assertFalse($text->hasTranslation('de'));
  }

  /**
   * Running the update again changes nothing.
   */
  public function testIdempotent(): void {
    ConfigurableLanguage::createFromLangcode('de')->save();
    $text = $this->createText('load', 'video', 'Video laden');
    blokkli_starterkit_post_update_english_text_defaults();
    $message = blokkli_starterkit_post_update_english_text_defaults();

    $this->assertSame('No texts still had the German default.', $message);
    $text = $this->reload($text);
    $this->assertSame('Load video', $text->getTranslation('en')->getTranslationText());
    $this->assertSame('Video laden', $text->getTranslation('de')->getTranslationText());
  }

}
