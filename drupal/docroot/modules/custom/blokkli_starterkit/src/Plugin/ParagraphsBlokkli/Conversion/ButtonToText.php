<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit\Plugin\ParagraphsBlokkli\Conversion;

use Drupal\Component\Utility\Html;
use Drupal\Component\Utility\UrlHelper;
use Drupal\link\LinkItemInterface;
use Drupal\paragraphs\ParagraphInterface;
use Drupal\paragraphs_blokkli\ParagraphMutationContextInterface;
use Drupal\paragraphs_blokkli_conversion\ParagraphConversionPluginBase;

/**
 * Converts a button paragraph to a text paragraph.
 *
 * @ParagraphConversion(
 *   id = "button_to_text",
 *   label = @Translation("Convert a button paragraph to a text paragraph."),
 *   source_bundle = "button",
 *   target_bundle = "text",
 * )
 */
class ButtonToText extends ParagraphConversionPluginBase {

  /**
   * {@inheritdoc}
   */
  public function convert(ParagraphInterface $paragraph, ParagraphMutationContextInterface $context): ?array {
    $label = (string) $paragraph->get('field_label')->value;
    $link = $paragraph->get('field_link')->first();

    $markup = '<p>' . Html::escape($label) . '</p>';
    if ($link instanceof LinkItemInterface && !$link->isEmpty()) {
      try {
        $markup = $this->getLinkMarkup($link, $label);
      }
      catch (\InvalidArgumentException) {
        // A stored URI Drupal can't generate a URL for (e.g. an unsupported
        // scheme): keep the label as text instead of failing the conversion.
      }
    }

    return [
      'field_text' => [
        'value' => $markup,
        'format' => 'basic_html',
      ],
    ];
  }

  /**
   * Builds a paragraph with a link to the button's target.
   *
   * The URL is generated (path alias for internal links) and collected
   * without bubbling cache metadata, since this runs inside a GraphQL mutation.
   * Label and URL are escaped; dangerous protocols such as javascript: are
   * removed.
   */
  private function getLinkMarkup(LinkItemInterface $link, string $label): string {
    $href = UrlHelper::stripDangerousProtocols(
      $link->getUrl()->toString(TRUE)->getGeneratedUrl()
    );

    return sprintf(
      '<p><a href="%s">%s</a></p>',
      Html::escape($href),
      Html::escape($label !== '' ? $label : $href),
    );
  }

}
