<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Core\Config\StorageInterface;
use Drupal\KernelTests\KernelTestBase;
use Drupal\language\Entity\ConfigurableLanguage;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests blokkli_starterkit_post_update_delete_tmgmt_english_overrides().
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class DeleteTmgmtEnglishOverridesTest extends KernelTestBase {

  private const TMGMT_VIEW = 'views.view.tmgmt_job_items';

  private const TMGMT_SIMPLE_CONFIG = 'tmgmt.settings';

  private const OTHER_CONFIG = 'system.site';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'block',
    'filter',
    'language',
    'locale',
    'options',
    'system',
    'tmgmt',
    'user',
    'views',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installSchema('locale', ['locales_source', 'locales_target', 'locales_location']);
    $this->installConfig(['system', 'language', 'locale', 'tmgmt']);
    ConfigurableLanguage::createFromLangcode('fr')->save();
    // Locale passes its translate_english setting, FALSE as on production,
    // to the container.
    $this->container->get('kernel')->rebuildContainer();
    require_once __DIR__ . '/../../../blokkli_starterkit.post_update.php';
  }

  /**
   * The raw storage of a language override collection.
   */
  private function overrideStorage(string $langcode): StorageInterface {
    return $this->container->get('config.storage')->createCollection("language.$langcode");
  }

  /**
   * Writes override rows as they are on production.
   */
  private function writeOverrides(): void {
    foreach (['en', 'fr'] as $langcode) {
      foreach ([self::TMGMT_VIEW, self::TMGMT_SIMPLE_CONFIG, self::OTHER_CONFIG] as $name) {
        $this->overrideStorage($langcode)->write($name, ['label' => "$langcode $name"]);
      }
    }
  }

  /**
   * English overrides of TMGMT config are deleted, everything else stays.
   */
  public function testDeletesEnglishOverridesOfTmgmtConfig(): void {
    $this->writeOverrides();

    // Drush and web requests in English set this, as on production.
    $english = $this->container->get('language_manager')->getLanguage('en');
    $this->container->get('language.config_factory_override')->setLanguage($english);
    $this->container->get('language_manager')->getLanguageConfigOverride('en', self::TMGMT_VIEW)->delete();
    $this->assertTrue(
      $this->overrideStorage('en')->exists(self::TMGMT_VIEW),
      'The config API cannot delete English overrides while English is the default language and not translatable.',
    );

    $message = blokkli_starterkit_post_update_delete_tmgmt_english_overrides();

    $this->assertSame('Deleted the English overrides of: tmgmt.settings, views.view.tmgmt_job_items.', $message);
    $this->assertFalse($this->overrideStorage('en')->exists(self::TMGMT_VIEW));
    $this->assertFalse($this->overrideStorage('en')->exists(self::TMGMT_SIMPLE_CONFIG));
    $this->assertTrue($this->overrideStorage('en')->exists(self::OTHER_CONFIG), 'English overrides of other config stay.');
    foreach ([self::TMGMT_VIEW, self::TMGMT_SIMPLE_CONFIG, self::OTHER_CONFIG] as $name) {
      $this->assertTrue($this->overrideStorage('fr')->exists($name), "The French override of $name stays.");
    }
    $this->assertTrue($this->container->get('config.storage')->exists(self::TMGMT_VIEW), 'The view itself stays for the uninstall.');
  }

  /**
   * Without English overrides of TMGMT config nothing changes.
   */
  public function testNoEnglishOverrides(): void {
    $this->assertSame('No English overrides of TMGMT config.', blokkli_starterkit_post_update_delete_tmgmt_english_overrides());
  }

}
