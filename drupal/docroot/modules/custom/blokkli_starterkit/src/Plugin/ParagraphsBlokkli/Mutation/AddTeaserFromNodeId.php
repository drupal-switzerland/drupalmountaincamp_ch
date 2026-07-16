<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit\Plugin\ParagraphsBlokkli\Mutation;

use Drupal\paragraphs_blokkli\ParagraphMutationContextInterface;
use Drupal\paragraphs_blokkli\ParagraphMutationPluginBase;
use Drupal\paragraphs_blokkli\ParagraphProxy;

/**
 * Adds a new teaser paragraph from a node ID.
 *
 * @ParagraphMutation(
 *   id = "add_teaser_from_node_id",
 *   label = @Translation("Add teaser paragraph from a node ID."),
 *   description = @Translation("Adds a new paragraph of type teaser for a node ID."),
 *   arguments = {
 *     "nid" = @ContextDefinition("string",
 *       label = @Translation("The node ID."),
 *     ),
 *     "hostType" = @ContextDefinition("string",
 *       label = @Translation("The entity type of the target host.")
 *     ),
 *     "hostUuid" = @ContextDefinition("string",
 *       label = @Translation("The UUID of the target host.")
 *     ),
 *     "hostFieldName" = @ContextDefinition("string",
 *       label = @Translation("The field name of the target host.")
 *     ),
 *     "afterUuid" = @ContextDefinition("string",
 *       label = @Translation("The UUID of the paragraph after which to add this one."),
 *       required = FALSE,
 *     ),
 *   }
 * )
 */
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
   *   The UUID of the paragraph after which the new paragraph will be added. Can be null for adding at the end.
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
