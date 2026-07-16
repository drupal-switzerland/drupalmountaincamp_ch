<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit\Plugin\views\field;

use Drupal\Core\Language\LanguageManagerInterface;
use Drupal\Core\Url;
use Drupal\block_content\BlockContentInterface;
use Drupal\media\MediaInterface;
use Drupal\node\NodeInterface;
use Drupal\rest\Plugin\views\display\RestExport;
use Drupal\taxonomy\TermInterface;
use Drupal\views\Plugin\views\field\FieldPluginBase;
use Drupal\views\ResultRow;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a view field to render links to all translations of a node.
 *
 * @ingroup views_field_handlers
 *
 * @ViewsField("translation_links_field")
 */
class TranslationLinksViewsField extends FieldPluginBase {

  /**
   * The available languages.
   *
   * @var \Drupal\Core\Language\LanguageInterface[]
   */
  protected $languages;

  /**
   * Constructs a new TranslationLinksViewsField.
   *
   * @param array $configuration
   *   A configuration array containing information about the plugin instance.
   * @param string $plugin_id
   *   The plugin_id for the plugin instance.
   * @param mixed $plugin_definition
   *   The plugin implementation definition.
   * @param \Drupal\Core\Language\LanguageManagerInterface $language_manager
   *   The language manager.
   */
  public function __construct(array $configuration, $plugin_id, $plugin_definition, LanguageManagerInterface $language_manager) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->languages = $language_manager->getLanguages();
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('language_manager')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function usesGroupBy() {
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function query() {
    // Do nothing -- to override the parent query.
  }

  /**
   * {@inheritdoc}
   */
  public function render(ResultRow $values) {
    $entity = $values->_entity;

    // Only render for supported entity types.
    if (
      !$entity instanceof NodeInterface &&
      !$entity instanceof BlockContentInterface &&
      !$entity instanceof MediaInterface &&
      !$entity instanceof TermInterface
    ) {
      return [];
    }

    // Non-reusable blocks can't be directly translated, so we don't show any
    // text at all.
    if ($entity instanceof BlockContentInterface && !$entity->isReusable()) {
      return [
        '#markup' => '-',
      ];
    }

    $type = $entity->getEntityTypeId();

    $items = [];
    $default_language_id = $entity->language()->getId();

    if ($this->displayHandler instanceof RestExport) {
      foreach ($this->languages as $language) {
        $language_id = $language->getId();
        if ($entity->hasTranslation($language_id)) {
          $items[] = $language_id;
        }
      }

      return implode('|', $items);
    }

    if (!$entity->isTranslatable()) {
      return [
        '#markup' => $this->t('Not translatable'),
      ];
    }

    foreach ($this->languages as $language) {
      $language_id = $language->getId();
      $name = $language->getName();
      $classes = ['views-liip-links-item'];
      $title = '';
      $url = NULL;

      if ($entity->hasTranslation($language_id)) {
        $url = Url::fromRoute("entity.$type.edit_form",
          [$type => $entity->id()],
          ['language' => $language]
        );

        if ($language_id === $default_language_id) {
          $classes[] = 'is-source';
          $title = sprintf('%s: %s (%s)', $this->t('Edit'), $name, $this->t('Original language'));
        }
        else {
          $title = sprintf('%s: %s', $this->t('Edit'), $name);
        }
      }
      else {
        $classes[] = 'is-missing';
        $title = sprintf('%s: %s', $this->t('Add'), $name);
        $url = Url::fromRoute(
          "entity.$type.content_translation_add",
          [
            'source' => $default_language_id,
            'target' => $language_id,
            $type => $entity->id(),
          ],
          [
            'language' => $language,
          ]
        );
      }

      $items[] = [
        '#type' => 'link',
        '#title' => $language_id,
        '#attributes' => [
          'class' => $classes,
          'title' => $title,
        ],
        '#url' => $url,
      ];
    }

    return [
      '#theme' => 'item_list',
      '#items' => $items,
      '#wrapper_attributes' => ['class' => 'views-liip-links'],
    ];
  }

}
