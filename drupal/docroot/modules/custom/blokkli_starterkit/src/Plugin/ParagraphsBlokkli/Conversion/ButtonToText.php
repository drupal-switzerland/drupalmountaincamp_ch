<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit\Plugin\ParagraphsBlokkli\Conversion;

use Drupal\Component\Utility\Html;
use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\link\LinkItemInterface;
use Drupal\paragraphs\ParagraphInterface;
use Drupal\paragraphs_blokkli\ParagraphMutationContextInterface;
use Drupal\paragraphs_blokkli_conversion\ParagraphConversionPluginBase;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
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
class ButtonToText extends ParagraphConversionPluginBase implements ContainerFactoryPluginInterface {

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    protected LoggerInterface $logger,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): static {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('logger.factory')->get('blokkli_starterkit'),
    );
  }

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
      catch (\InvalidArgumentException | RoutingException $e) {
        // A stored link Drupal can't generate a URL for (unsupported scheme,
        // removed route, missing route parameter): keep the label as text
        // instead of failing the conversion.
        $this->logger->warning('Button to text: kept the label of button @uuid as text, its link @uri has no URL: @message', [
          '@uuid' => $paragraph->uuid(),
          '@uri' => $link->getValue()['uri'] ?? '',
          '@message' => $e->getMessage(),
        ]);
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
   * escaped; dangerous protocols such as javascript: are removed. Link
   * attributes such as target aren't carried over: the button never rendered
   * them.
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
