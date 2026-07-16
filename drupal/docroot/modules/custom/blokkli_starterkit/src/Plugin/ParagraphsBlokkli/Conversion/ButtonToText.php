<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit\Plugin\ParagraphsBlokkli\Conversion;

use Drupal\Core\Url;
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
    $link = $paragraph->get('field_link')->first();
    $title = $paragraph->get('field_title')->first()?->value;
    $text = '';

    if ($link instanceof LinkItemInterface) {
      $url = $link->getUrl();
      $text = $this->getLinkMarkup($url, $title);
    }

    return [
      'paragraphs_text' => [
        'value' => $text,
        'format' => 'basic_html',
      ],
    ];
  }

  /**
   * Get the <a> tag for the given URL and title.
   *
   * @param Url $url
   *   The Url.
   * @param string|null $title
   *   The link title.
   *
   * @return string|null
   *   The markup.
   */
  private function getLinkMarkup(Url $url, string|null $title): string|null {
    if ($url) {
      if ($url->isExternal()) {
        $path = $url->toString();
        return sprintf('<a href="%s">%s</a>', $path, $title ?? $path);
      }
      elseif ($url->isRouted()) {
        $options = $url->getOptions();
        $href = $options['href'] ?? $url->getInternalPath();
        $type = $options['data-entity-type'] ?? '';
        $uuid = $options['data-entity-uuid'] ?? '';
        $substitution = $options['data-entity-substitution'] ?? '';

        return sprintf(
          '<p><a href="%s" data-entity-type="%s" data-entity-uuid="%s" data-entity-substitution="%s">%s</a></p>',
          $href,
          $type,
          $uuid,
          $substitution,
          $title ?? $href
        );
      }
    }
    return NULL;
  }

}
