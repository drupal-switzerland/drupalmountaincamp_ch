<?php

/**
 * @file
 * Recreates the Sponsor nodes of the old (pre-2027) site from sponsors.csv.
 *
 * The CSV was exported from the last prod DB backup of the old site
 * (2026-07-05); the old site's files were not backed up, so logos are only
 * attached when a file with the CSV's "logo" name exists in the logos dir.
 *
 * Usage (idempotent — existing title+year pairs are skipped, except that a
 * logo is attached to an existing node that has none yet when the file shows up):
 *   cd /app/drupal && drush php:script ../scripts/drupal/sponsors/import-sponsors.php [-- /path/to/logos]
 */

use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\media\Entity\Media;
use Drupal\node\Entity\Node;

$dir = __DIR__;
$logos_dir = $extra[0] ?? $dir . '/logos';
// Old sponsorship_type term names -> field_sponsor_tier allowed values.
$tiers = [
  'Diamond' => 'diamond',
  'Platinum' => 'platinum',
  'Gold' => 'gold',
  'Silver' => 'silver',
  'Bronze' => 'bronze',
  'Social Event Sponsor' => 'social',
  'Contribution Sponsor' => 'contribution',
  'Media partner' => 'media',
  'Individual Sponsor' => 'individual',
];

$node_storage = \Drupal::entityTypeManager()->getStorage('node');
$destination = 'public://images/logos';
\Drupal::service('file_system')->prepareDirectory($destination, FileSystemInterface::CREATE_DIRECTORY);

/**
 * Copies a logo file into public://images/logos and wraps it in an image media.
 */
function create_logo_media(string $path, string $name): int {
  $fs = \Drupal::service('file_system');
  $file = \Drupal::service('file.repository')->writeData(file_get_contents($path), 'public://images/logos/' . $fs->basename($path), FileExists::Replace);
  $media = Media::create([
    'bundle' => 'image',
    'name' => $name,
    'field_media_image' => ['target_id' => $file->id(), 'alt' => $name],
  ]);
  $media->save();
  return (int) $media->id();
}

$fh = fopen($dir . '/sponsors.csv', 'r');
$header = fgetcsv($fh);
$created = $skipped = $without_logo = $logos_added = 0;
while (($values = fgetcsv($fh)) !== FALSE) {
  $row = array_combine($header, $values);
  $logo = $logos_dir . '/' . $row['logo'];
  $has_logo = $row['logo'] !== '' && is_file($logo);
  $existing = $node_storage->loadByProperties(['type' => 'sponsor', 'title' => $row['title'], 'field_year' => $row['year']]);
  if ($existing) {
    $existing = reset($existing);
    if ($has_logo && $existing->get('field_image')->isEmpty()) {
      $existing->set('field_image', create_logo_media($logo, $row['title']))->save();
      $logos_added++;
    }
    $skipped++;
    continue;
  }
  $node = [
    'type' => 'sponsor',
    'langcode' => 'en',
    'title' => $row['title'],
    'status' => (int) $row['status'],
    'field_year' => (int) $row['year'],
    'field_sponsor_tier' => $tiers[$row['tier']] ?? 'silver',
  ];
  if ($row['link'] !== '') {
    $node['field_link'] = ['uri' => $row['link']];
  }
  if ($row['description'] !== '') {
    $node['field_teaser'] = ['value' => $row['description'], 'format' => 'basic_html'];
  }
  if ($has_logo) {
    $node['field_image'] = create_logo_media($logo, $row['title']);
  }
  else {
    $without_logo++;
  }
  Node::create($node)->save();
  $created++;
}
fclose($fh);
print "Sponsors: $created created, $skipped already existed ($logos_added got a logo), $without_logo created without logo.\n";
