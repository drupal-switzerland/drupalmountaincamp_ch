<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit\Plugin\ParagraphsBlokkli\Conversion;

use Drupal\Component\Utility\Html;
use Drupal\Component\Utility\UrlHelper;
use Drupal\link\LinkItemInterface;
use Drupal\paragraphs\ParagraphInterface;
use Drupal\paragraphs_blokkli\ParagraphMutationContextInterface;
use Drupal\paragraphs_blokkli_conversion\ParagraphConversionPluginBase;
use Symfony\Component\Routing\Exception\ExceptionInterface as RoutingException;

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
        $markup = $this->getLinkMarkup($link, $label) ?? $markup;
      }
      catch (\InvalidArgumentException | RoutingException) {
        // A stored link Drupal can't generate a URL for (unsupported scheme,
        // removed route, missing route parameter): keep the label as text
        // instead of failing the conversion.
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
   * The URL is generated (path alias for internal links), like a link an
   * editor adds in CKEditor: basic_html has no linkit filter and pathologic
   * doesn't resolve /node/N to its alias. Cache metadata is collected instead
   * of bubbled, since this runs inside a GraphQL mutation. Label and URL are
   * escaped; dangerous protocols such as javascript: are removed.
   *
   * @return string|null
   *   The markup, or NULL when the target has no URL (<nolink>, <button>).
   */
  private function getLinkMarkup(LinkItemInterface $link, string $label): ?string {
    $href = UrlHelper::stripDangerousProtocols(
      $link->getUrl()->toString(TRUE)->getGeneratedUrl()
    );
    if ($href === '') {
      return NULL;
    }

    return sprintf(
      '<p><a href="%s">%s</a></p>',
      Html::escape($href),
      Html::escape($label !== '' ? $label : $href),
    );
  }

}
