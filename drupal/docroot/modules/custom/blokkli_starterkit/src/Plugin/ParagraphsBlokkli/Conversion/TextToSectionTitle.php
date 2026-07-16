<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit\Plugin\ParagraphsBlokkli\Conversion;

use Drupal\paragraphs\ParagraphInterface;
use Drupal\paragraphs_blokkli\ParagraphMutationContextInterface;
use Drupal\paragraphs_blokkli_conversion\ParagraphConversionPluginBase;

/**
 * Converts a Text paragraph to a Section Title paragraph.
 *
 * @ParagraphConversion(
 *   id = "text_to_section_title",
 *   label = @Translation("Convert a text paragraph to a section_title paragraph."),
 *   source_bundle = "text",
 *   target_bundle = "section_title",
 * )
 */
class TextToSectionTitle extends ParagraphConversionPluginBase {

  /**
   * {@inheritdoc}
   */
  public function convert(ParagraphInterface $paragraph, ParagraphMutationContextInterface $context): ?array {
    $text = $paragraph->get('paragraphs_text')->value ?? '';
    return [
      'field_title' => strip_tags($text),
    ];
  }

}
