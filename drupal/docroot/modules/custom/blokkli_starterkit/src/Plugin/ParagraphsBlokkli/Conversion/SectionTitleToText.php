<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit\Plugin\ParagraphsBlokkli\Conversion;

use Drupal\paragraphs\ParagraphInterface;
use Drupal\paragraphs_blokkli\ParagraphMutationContextInterface;
use Drupal\paragraphs_blokkli_conversion\ParagraphConversionPluginBase;

/**
 * Converts a Section Title paragraph to a Text paragraph.
 *
 * @ParagraphConversion(
 *   id = "section_title_to_text",
 *   label = @Translation("Convert a section_title paragraph to a text paragraph."),
 *   source_bundle = "section_title",
 *   target_bundle = "text",
 * )
 */
class SectionTitleToText extends ParagraphConversionPluginBase {

  /**
   * {@inheritdoc}
   */
  public function convert(ParagraphInterface $paragraph, ParagraphMutationContextInterface $context): ?array {
    $title = $paragraph->get('field_title')->value;

    $text = '';

    if ($title) {
      $text .= "<h2>$title</h2>";
    }

    return [
      'paragraphs_text' => [
        'value' => $text,
        'format' => 'basic_html',
      ],
    ];
  }

}
