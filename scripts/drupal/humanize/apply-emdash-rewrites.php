<?php

/**
 * @file
 * Applies the reviewed em-dash rewrites in emdash-rewrites.json to content.
 *
 * Each record holds the exact current field value ("old") and its rewrite
 * ("new"); a record is skipped when the live value no longer matches, so a
 * concurrent edit is never overwritten. Nodes get a new revision, paragraphs
 * are updated in their current revision so the host node keeps pointing at it.
 *
 * Usage:
 *   cd /app/drupal && drush php:script ../scripts/drupal/humanize/apply-emdash-rewrites.php
 *   drush php:script ../scripts/drupal/humanize/find-emdash.php   # lists what is left
 */

$items = json_decode(file_get_contents(__DIR__ . '/emdash-rewrites.json'), TRUE);
$etm = \Drupal::entityTypeManager();
$done = $skipped = 0;
foreach ($items as $it) {
  $entity = $etm->getStorage($it['entity_type'])->load($it['id']);
  if (!$entity) {
    print "MISSING {$it['entity_type']} {$it['id']}\n";
    $skipped++;
    continue;
  }
  $field = $entity->get($it['field']);
  if ($field->value !== $it['old']) {
    print "CHANGED SINCE SCAN {$it['entity_type']} {$it['id']}, skipped\n";
    $skipped++;
    continue;
  }
  $entity->set($it['field'], ['value' => $it['new'], 'format' => $field->format]);
  if ($it['entity_type'] === 'node') {
    $entity->setNewRevision(TRUE);
    $entity->setRevisionLogMessage('Replace em-dashes with plain punctuation');
    $entity->setRevisionCreationTime(\Drupal::time()->getRequestTime());
  }
  else {
    $entity->setNewRevision(FALSE);
  }
  $entity->save();
  $done++;
}
print "Rewrites: $done applied, $skipped skipped.\n";
