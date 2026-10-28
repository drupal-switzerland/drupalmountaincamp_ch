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

/**
 * Deletes the TMGMT translation jobs so that TMGMT can be uninstalled.
 *
 * Drupal refuses to uninstall a module while content entities of it exist,
 * and the configuration import that follows this update uninstalls TMGMT.
 * The translations themselves are not TMGMT entities and stay. Jobs go first:
 * a job deletes its own items, messages and remote mappings, and an item of a
 * deleted job never asks for the job's translator, which no longer exists.
 * Whatever is left after that is deleted directly. Without TMGMT this does
 * nothing.
 */
function blokkli_starterkit_post_update_delete_tmgmt_jobs(array &$sandbox): string {
  $batchSize = 50;
  $entityTypeManager = \Drupal::entityTypeManager();
  $entityTypeIds = array_values(array_filter(
    ['tmgmt_job', 'tmgmt_job_item', 'tmgmt_message', 'tmgmt_remote'],
    $entityTypeManager->hasDefinition(...),
  ));
  if (!$entityTypeIds) {
    $sandbox['#finished'] = 1;
    return 'TMGMT is not installed, no translation jobs to delete.';
  }

  $count = fn (string $entityTypeId): int => (int) $entityTypeManager->getStorage($entityTypeId)
    ->getQuery()
    ->accessCheck(FALSE)
    ->count()
    ->execute();
  $sandbox['initial'] ??= array_combine($entityTypeIds, array_map($count, $entityTypeIds));

  foreach ($entityTypeIds as $entityTypeId) {
    $storage = $entityTypeManager->getStorage($entityTypeId);
    $ids = $storage->getQuery()
      ->accessCheck(FALSE)
      ->sort($storage->getEntityType()->getKey('id'))
      ->range(0, $batchSize)
      ->execute();
    if ($ids) {
      $entities = $storage->loadMultiple($ids);
      if (count($entities) !== count($ids)) {
        throw new \RuntimeException("Could not load all $entityTypeId entities to delete: " . implode(', ', array_diff($ids, array_keys($entities))));
      }
      $storage->delete($entities);
      $sandbox['#finished'] = 0;
      return "Deleting $entityTypeId entities.";
    }
  }

  $sandbox['#finished'] = 1;
  $summary = [];
  foreach ($sandbox['initial'] as $entityTypeId => $initial) {
    $summary[] = "$entityTypeId: $initial";
  }
  return 'Deleted TMGMT entities (' . implode(', ', $summary) . ').';
}

/**
 * Deletes the schema version that the removed module tmgmt_deepl left behind.
 *
 * Without it, every update run warns that tmgmt_deepl has an entry in
 * system.schema but is missing from the site.
 *
 * @see https://www.drupal.org/node/3137656
 */
function blokkli_starterkit_post_update_delete_tmgmt_deepl_schema_version(): string {
  $module = 'tmgmt_deepl';
  if (\Drupal::moduleHandler()->moduleExists($module)) {
    return "$module is installed, its schema version is kept.";
  }
  /** @var \Drupal\Core\Update\UpdateHookRegistry $registry */
  $registry = \Drupal::service('update.update_hook_registry');
  if ($registry->getInstalledVersion($module) === $registry::SCHEMA_UNINSTALLED) {
    return "$module has no schema version.";
  }
  $registry->deleteInstalledVersion($module);
  return "Deleted the schema version of $module.";
}
