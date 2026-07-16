<?php

/**
 * @file
 * Views hook implementations for the blokkli starterkit module.
 */

declare(strict_types=1);

/**
 * Implements hook_views_data().
 */
function blokkli_starterkit_views_data_alter(array &$data) {
  $translation_links_field = [
    'title' => t('Translations'),
    'field' => [
      'title' => t('Translations'),
      'help' => t('Views field plugin to display a list of translation links.'),
      'id' => 'translation_links_field',
    ],
  ];

  $data['node']['translation_links_field'] = $translation_links_field;
  $data['block_content']['translation_links_field'] = $translation_links_field;
  $data['media']['translation_links_field'] = $translation_links_field;
  $data['taxonomy_term_field_data']['translation_links_field'] = $translation_links_field;
}
