<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\ExistingSite;

use Drupal\node\NodeInterface;
use Drupal\paragraphs\ParagraphInterface;
use Drupal\paragraphs_blokkli\EditStateInterface;

/**
 * Tests the add_teaser_from_node_id blökkli mutation.
 *
 * Runs against the site's real paragraph types, so the teaser bundle and its
 * node reference field are covered too. Nothing is published: assertions read
 * the mutated edit state.
 */
class AddTeaserFromNodeIdTest extends BlokkliStarterkitExistingSiteBase {

  /**
   * The page that receives the teasers.
   */
  protected NodeInterface $host;

  /**
   * The blökkli edit state of the host page.
   */
  protected EditStateInterface $editState;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->host = $this->createPage();

    $editState = \Drupal::service('paragraphs_blokkli.manager')->getParagraphsEditState($this->host);
    $this->assertInstanceOf(EditStateInterface::class, $editState);
    $this->markEntityForCleanup($editState);
    $this->editState = $editState;
  }

  /**
   * A teaser referencing the node is added to the host field.
   */
  public function testAddsTeaserForNode(): void {
    $target = $this->createPage();
    $this->addTeaser($target, 'teaser-a');

    $paragraphs = $this->getHostParagraphs();
    $this->assertCount(1, $paragraphs);
    $this->assertSame('teaser', $paragraphs[0]->bundle());
    $this->assertSame((string) $target->id(), (string) $paragraphs[0]->get('field_node_ref')->target_id);
  }

  /**
   * Teasers go after the given paragraph, or first without one.
   */
  public function testPlacesTeaserAfterGivenParagraph(): void {
    $target = $this->createPage();
    $last = $this->addTeaser($target, 'teaser-a');
    $first = $this->addTeaser($target, 'teaser-b');
    $middle = $this->addTeaser($target, 'teaser-c', $first);

    $uuids = array_map(
      fn (ParagraphInterface $paragraph) => $paragraph->uuid(),
      $this->getHostParagraphs(),
    );
    $this->assertSame([$first, $middle, $last], $uuids);
  }

  /**
   * Creates a published page that is removed after the test.
   */
  private function createPage(): NodeInterface {
    return $this->createContent([
      'type' => 'page',
      'title' => $this->randomString(),
      'status' => TRUE,
    ]);
  }

  /**
   * Adds the mutation to the edit state and returns the new paragraph UUID.
   */
  private function addTeaser(NodeInterface $target, string $label, ?string $afterUuid = NULL): string {
    $uuid = \Drupal::service('uuid')->generate();
    $mutation = \Drupal::service('plugin.manager.paragraph_mutation')->createInstance('add_teaser_from_node_id', [
      'new_paragraph_uuid_default' => $uuid,
      'nid' => (string) $target->id(),
      'hostType' => 'node',
      'hostUuid' => $this->host->uuid(),
      'hostFieldName' => 'field_paragraphs',
      'afterUuid' => $afterUuid,
    ]);
    $this->editState->addMutation($mutation);
    $this->editState->save();

    $this->assertFalse($this->editState->getMutatedState()->hasErrors(), "Mutation for $label has no errors");
    return $uuid;
  }

  /**
   * Returns the paragraphs of the host field in the mutated state.
   *
   * @return \Drupal\paragraphs\ParagraphInterface[]
   *   The paragraphs, in field order.
   */
  private function getHostParagraphs(): array {
    foreach ($this->editState->getMutatedState()->getFields() as $field) {
      if ($field->getEntityUuid() === $this->host->uuid() && $field->getFieldName() === 'field_paragraphs') {
        return array_values($field->getParagraphs());
      }
    }
    return [];
  }

}
