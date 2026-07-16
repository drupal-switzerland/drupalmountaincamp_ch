<?php

namespace Drupal\blokkli_starterkit\Entity\Node;

use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\bca\Attribute\Bundle;
use Drupal\media\MediaInterface;
use Drupal\node\Entity\Node;
use Drupal\paragraphs_blokkli_search\BlokkliSearchThumbnailAwareEntityInterface;

#[Bundle(
  entityType: 'node',
  bundle: 'page',
  label: new TranslatableMarkup('Page'),
)]
class NodePage extends Node implements BlokkliSearchThumbnailAwareEntityInterface {

  /**
   * {@inheritdoc}
   */
  public function getBlokkliThumbnailMedia(): ?MediaInterface {
    /** @var \Drupal\Core\Field\EntityReferenceFieldItemList $field */
    $field = $this->get('field_image');
    return $field->referencedEntities()[0] ?? NULL;
  }

}
