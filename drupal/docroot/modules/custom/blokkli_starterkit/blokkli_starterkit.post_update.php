<?php

/**
 * @file
 * Post update functions for blokkli_starterkit.
 */

declare(strict_types=1);

use Drupal\blokkli_starterkit\RokkaFileMigration;

/**
 * Replaces German interface text defaults stored as English with English.
 *
 * The texts module stores a text's code default the first time it is used,
 * so changing the default in code doesn't change texts that already exist.
 * Only English values still equal to the old German default are replaced;
 * on a site with German, the German value is kept as the German translation
 * unless one exists.
 */
function blokkli_starterkit_post_update_english_text_defaults(): string {
  // [context, key, old German default, English default].
  $defaults = [
    ['default', 'menu', 'Menü', 'Menu'],
    ['default', 'more_information', 'Mehr Informationen', 'More information'],
    ['default', 'scrollableTable', 'Scrollbare Tabelle', 'Scrollable table'],
    ['slides', 'prev', 'Vorherige', 'Previous'],
    ['slides', 'next', 'Nächste', 'Next'],
    ['video', 'load', 'Video laden', 'Load video'],
    ['search', 'ctaButton', 'Suchen', 'Search'],
    ['search', 'searchFieldLabel', 'Suchbegriff', 'Search term'],
    ['search', 'searchFieldPlaceholder', 'Suchbegriff eingeben', 'Enter a search term'],
  ];

  /** @var \Drupal\texts\TextsStorageInterface $storage */
  $storage = \Drupal::entityTypeManager()->getStorage('texts');
  $hasGerman = \Drupal::languageManager()->getLanguage('de') !== NULL;
  $updated = [];
  foreach ($defaults as [$context, $key, $german, $english]) {
    $text = $storage->loadByKey($key, $context);
    if (!$text || !$text->hasTranslation('en')) {
      continue;
    }
    $englishText = $text->getTranslation('en');
    if ($englishText->getTranslationText() !== $german) {
      continue;
    }
    if ($hasGerman && !$text->hasTranslation('de')) {
      $text->addTranslation('de', ['translation' => $german]);
    }
    $englishText->setTranslationText($english);
    $text->save();
    $updated[] = "$context.$key";
  }

  return $updated
    ? 'English defaults set for: ' . implode(', ', $updated) . '.'
    : 'No texts still had the German default.';
}

/**
 * Moves rokka:// files to public:// from rokka's public CDN.
 *
 * Without a rokka API key, Drupal can't read rokka:// files, which breaks the
 * media edit form of SVG images. Failures are logged, not thrown, so a deploy
 * still completes.
 */
function blokkli_starterkit_post_update_move_rokka_files_to_public(): string {
  return \Drupal::classResolver(RokkaFileMigration::class)->moveAll();
}
