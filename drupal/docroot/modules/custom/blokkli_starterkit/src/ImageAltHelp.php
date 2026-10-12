<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit;

use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * Help text under the alternative text input of image media.
 *
 * Core's image widget hardcodes that text, and the media library's upload
 * form hides the description of the image field itself, so a field
 * description can't carry it.
 */
final class ImageAltHelp {

  /**
   * The image field of image media.
   */
  private const FIELD = 'media.field_media_image';

  /**
   * Whether a field is the image field of image media.
   */
  public static function applies(FieldDefinitionInterface $field_definition): bool {
    return $field_definition->getTargetEntityTypeId() . '.' . $field_definition->getName() === self::FIELD;
  }

  /**
   * The help text.
   */
  public static function description(): TranslatableMarkup {
    return new TranslatableMarkup('Describe in one sentence what this picture shows. Each picture gets its own description. Do not put the photographer or source here.');
  }

  /**
   * The #process callback for the image widget, after the widget's own.
   */
  public static function process(array $element, FormStateInterface $form_state, array $form): array {
    if (isset($element['alt'])) {
      $element['alt']['#description'] = self::description();
    }
    return $element;
  }

}
