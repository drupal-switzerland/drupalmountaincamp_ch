<?php

namespace Drupal\blokkli_starterkit\Drush\Commands;

use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Database\Connection;
use Drush\Attributes as CLI;
use Drush\Commands\AutowireTrait;
use Drush\Commands\DrushCommands;
use Drush\Drush;

/**
 * A Drush commandfile.
 */
final class BlokkliStarterkitCommands extends DrushCommands {

  use AutowireTrait;

  /**
   * Constructs a BlokkliStarterkitCommands object.
   */
  public function __construct(
    private readonly Connection $connection,
    private readonly ConfigFactoryInterface $configFactory,
  ) {
    parent::__construct();
  }

  /**
   * Command description here.
   */
  #[CLI\Command(name: 'blokkli_starterkit:convert-db-language', aliases: ['cdl'])]
  #[CLI\Argument(name: 'fromLanguage', description: 'From language.')]
  #[CLI\Argument(name: 'toLanguage', description: 'To language.')]
  #[CLI\Usage(name: 'blokkli_starterkit:convert-db-language de en', description: 'Converts the default language from German to English.')]
  public function convertLanguage($fromLanguage, $toLanguage) {

    // Query to get all tables containing the langcode field.
    $query = $this->connection->select('information_schema.columns', 'c')
      ->fields('c', ['table_name'])
      ->condition('c.table_schema', 'db')
      ->condition('c.column_name', 'langcode')
      ->orderBy('c.table_name');
    $tables = $query->execute()->fetchCol();

    // Iterate over each table and update the langcode field.
    foreach ($tables as $table) {
      $update_query = $this->connection->update($table)
        ->fields(['langcode' => $toLanguage])
        ->condition('langcode', $fromLanguage);
      $update_query->execute();
      $this->logger()->success(dt('Updated langcode in table @table', ['@table' => $table]));
    }
    $this->updateDefaultLanguage($toLanguage);

    if ($toLanguage === 'en') {
      $this->updateNodeTitles();
      $this->updateConfiguration();
      drupal_flush_all_caches();
    }
    $self = Drush::aliasManager()->getSelf();
    $process = Drush::drush($self, 'config-export', [], ['yes' => NULL]);
    $process->setSimulated(FALSE);
    $process->mustRun();

    $this->logger()->success(dt('Config updated and exported.'));

    $this->updateNuxtConfig('../../frontend/nuxt.config.ts', $fromLanguage, $toLanguage);
    $this->logger()->success(dt('Nuxt Config updated.'));

    $this->logger()->success(dt('DB converted.'));
  }

  public function updateNuxtConfig($filePath, $fromLanguage, $toLanguage) {
    $content = file_get_contents($filePath);

    $langcodesArray = "const LANGCODES = ['$toLanguage', '$fromLanguage', 'fr']";

    // Replace LANGCODES array
    $content = preg_replace("/const LANGCODES = \[.*?]/", $langcodesArray, $content);

    // Replace defaultLanguage
    $content = preg_replace("/defaultLanguage: '$fromLanguage'/", "defaultLanguage: '$toLanguage'", $content);

    // Write the updated content back to the file
    file_put_contents($filePath, $content);
  }

  public function updateNodeTitles() {

    $tables = [
      'node_field_data',
      'node_field_revision',
      'menu_link_content_data',
      'menu_link_content_field_revision',
    ];

    $strings = [
      'Kontakt' => 'Contact',
      'Projekte' => 'Projects',
      'Über' => 'About',
      'Kultur' => 'Culture',
      'Kompetenzen' => 'Expertise',
      'Suche' => 'Search',
    ];

    foreach ($tables as $table) {
      foreach ($strings as $de => $en) {
        $this->connection->update($table)
          ->fields(['title' => $en])
          ->condition('title', $de)
          ->execute();
      }
    }

    $this->logger()->success(dt('Node titles updated.'));

  }

  private function updateDefaultLanguage($toLanguage) {
    $config = $this->configFactory->getEditable('system.site');
    $config->set('default_langcode', $toLanguage);
    $config->save();
  }

  private function updateConfiguration() {

    $config = $this->configFactory->getEditable('field.field.paragraph.quote.field_quote');
    $config->set('label', 'Quote');
    $config->save();

    $config = $this->configFactory->getEditable('paragraphs.paragraphs_type.quote');
    $config->set('label', 'Quote');
    $config->save();

    $config = $this->configFactory->getEditable('paragraphs.paragraphs_type.text_image');
    $config->set('label', 'Text / Image');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.media.image.field_caption');
    $config->set('label', 'Caption');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.node.press_release.field_image');
    $config->set('label', 'Image');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.paragraph.quote.field_media_image');
    $config->set('label', 'Image');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.paragraph.text_image.field_image');
    $config->set('label', 'Image');
    $config->save();

    $config = $this->configFactory->getEditable('paragraphs.paragraphs_type.image');
    $config->set('label', 'Image');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.node.page.field_paragraphs');
    $config->set('label', 'Paragraphs');
    $config->save();

    $config = $this->configFactory->getEditable('core.entity_form_display.node.page.default');
    $config->set('third_party_settings.field_group.group_content.label', 'Content');
    $config->set('third_party_settings.field_group.group_media.label', 'Media');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.node.press_release.field_paragraphs');
    $config->set('label', 'Content');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.paragraph.accordeon.field_content');
    $config->set('label', 'Content');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.paragraph.icon_text_list.field_content');
    $config->set('label', 'Content');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.paragraph.icon_text_list.field_content');
    $config->set('label', 'Content');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.node.page.field_image');
    $config->set('label', 'Teaser Image');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.node.page.field_hero_image');
    $config->set('label', 'Hero Image');
    $config->save();

    $config = $this->configFactory->getEditable('paragraphs.paragraphs_type.carousel');
    $config->set('label', 'Carousel');
    $config->save();

    $config = $this->configFactory->getEditable('paragraphs.paragraphs_type.teaser_list');
    $config->set('label', 'Teaserlist');
    $config->save();

    $config = $this->configFactory->getEditable('paragraphs.paragraphs_type.from_library');
    $config->set('label', 'From library');
    $config->save();

    $config = $this->configFactory->getEditable('field.field.node.press_release.field_contact');
    $config->set('label', 'Contact');
    $config->save();

    $config = $this->configFactory->getEditable('node.type.press_release');
    $config->set('name', 'Press Release');
    $config->set('description', '');
    $config->save();

    $config = $this->configFactory->getEditable('node.type.contact');
    $config->set('name', 'Contact');
    $config->set('description', '');
    $config->save();

    $config = $this->configFactory->getEditable('node.type.page');
    $config->set('name', 'Page');
    $config->set('description', '');
    $config->save();

  }

}
