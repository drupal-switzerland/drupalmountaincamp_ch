<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit\Plugin\ParagraphsBlokkli\Mutation;

use Drupal\Core\Plugin\Context\ContextDefinition;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\paragraphs_blokkli\Attribute\ParagraphMutation;
use Drupal\paragraphs_blokkli\ParagraphMutationContextInterface;
use Drupal\paragraphs_blokkli\ParagraphMutationPluginBase;
use Drupal\paragraphs_blokkli\ParagraphProxy;

/**
 * Adds a new teaser paragraph from a node ID.
 */
#[ParagraphMutation(
  id: 'add_teaser_from_node_id',
  label: new TranslatableMarkup('Add teaser paragraph from a node ID.'),
  description: new TranslatableMarkup('Adds a new paragraph of type teaser for a node ID.'),
  arguments: [
    'nid' => new ContextDefinition(
      data_type: 'string',
      label: new TranslatableMarkup('The node ID.'),
    ),
    'hostType' => new ContextDefinition(
      data_type: 'string',
      label: new TranslatableMarkup('The entity type of the target host.'),
    ),
    'hostUuid' => new ContextDefinition(
      data_type: 'string',
      label: new TranslatableMarkup('The UUID of the target host.'),
    ),
    'hostFieldName' => new ContextDefinition(
      data_type: 'string',
      label: new TranslatableMarkup('The field name of the target host.'),
    ),
    'afterUuid' => new ContextDefinition(
      data_type: 'string',
      label: new TranslatableMarkup('The UUID of the paragraph after which to add this one.'),
      required: FALSE,
    ),
  ],
)]
class AddTeaserFromNodeId extends ParagraphMutationPluginBase {

  /**
   * Executes the method.
   *
   * @param \Drupal\paragraphs_blokkli\ParagraphMutationContextInterface $context
   *   The paragraph mutation context object.
   * @param string $nid
   *   The node ID.
   * @param string $hostType
   *   The host paragraph type.
   * @param string $hostUuid
   *   The host paragraph UUID.
   * @param string $hostFieldName
   *   The name of the host paragraph field where the paragraph will be added.
   * @param string|null $afterUuid
   *   The UUID of the paragraph after which the new paragraph will be added.
   *   Can be null for adding at the start.
   */
  public function execute(
    ParagraphMutationContextInterface $context,
    string $nid,
    string $hostType,
    string $hostUuid,
    string $hostFieldName,
    ?string $afterUuid,
  ): void {
    $paragraph = $this->createNewParagraph([
      'type' => 'teaser',
      'uuid' => $this->getUuidForNewEntity(),
      'field_node_ref' => [
        'target_id' => $nid,
      ],
    ]);
    $proxy = new ParagraphProxy($paragraph, $hostType, $hostUuid, $hostFieldName);
    $context->addProxy($proxy, $afterUuid);
  }

}
