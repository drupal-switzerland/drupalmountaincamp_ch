<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Unit;

use Drupal\blokkli_starterkit\Plugin\ParagraphsBlokkli\Mutation\AddTeaserFromNodeId;
use Drupal\Component\Uuid\UuidInterface;
use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Entity\FieldableEntityInterface;
use Drupal\paragraphs\ParagraphInterface;
use Drupal\paragraphs_blokkli\ParagraphMutationContext;
use Drupal\paragraphs_blokkli\ParagraphProxyInterface;
use Drupal\paragraphs_blokkli\ParagraphsBlokkliHelper;
use Drupal\Tests\UnitTestCase;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the add_teaser_from_node_id blökkli mutation.
 *
 * Uses blökkli's own mutation context, so the placement of the new teaser is
 * the one the editor gets.
 */
#[CoversClass(AddTeaserFromNodeId::class)]
#[Group('blokkli_starterkit')]
class AddTeaserFromNodeIdTest extends UnitTestCase {

  private const HOST_UUID = 'host-uuid';

  /**
   * The values each created paragraph was created with, by UUID.
   *
   * @var array<string, array>
   */
  private array $created = [];

  /**
   * The context the mutations run on.
   */
  private ParagraphMutationContext $context;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->context = new ParagraphMutationContext($this->createMock(FieldableEntityInterface::class));
  }

  /**
   * Runs the mutation and returns the UUID of the teaser it added.
   */
  private function addTeaser(string $nid, ?string $afterUuid = NULL, array $configuration = []): string {
    $storage = $this->createMock(EntityStorageInterface::class);
    $storage->method('create')->willReturnCallback(function (array $values) {
      $this->created[$values['uuid']] = $values;
      $paragraph = $this->createMock(ParagraphInterface::class);
      $paragraph->method('uuid')->willReturn($values['uuid']);
      $paragraph->method('getAllBehaviorSettings')->willReturn([]);
      return $paragraph;
    });
    $entityTypeManager = $this->createMock(EntityTypeManagerInterface::class);
    $entityTypeManager->method('getStorage')->with('paragraph')->willReturn($storage);

    $uuid = $this->createMock(UuidInterface::class);
    $uuid->method('generate')->willReturn('generated-' . count($this->created));

    $plugin = new AddTeaserFromNodeId(
      $configuration,
      'add_teaser_from_node_id',
      [],
      $entityTypeManager,
      $uuid,
      $this->createMock(ParagraphsBlokkliHelper::class),
    );
    $before = array_keys($this->created);
    $plugin->execute($this->context, $nid, 'node', self::HOST_UUID, 'field_paragraphs', $afterUuid);

    $added = array_values(array_diff(array_keys($this->created), $before));
    $this->assertCount(1, $added, 'One paragraph is created per mutation.');
    return $added[0];
  }

  /**
   * Returns the UUIDs of the paragraphs in the context, in order.
   *
   * @return string[]
   *   The UUIDs.
   */
  private function uuidsInContext(): array {
    return array_map(
      fn (ParagraphProxyInterface $proxy) => $proxy->uuid(),
      $this->context->proxies,
    );
  }

  /**
   * The new paragraph is a teaser that references the given node.
   */
  public function testCreatesTeaserReferencingTheNode(): void {
    $uuid = $this->addTeaser('42');

    $this->assertSame([
      'type' => 'teaser',
      'uuid' => $uuid,
      'field_node_ref' => ['target_id' => '42'],
    ], $this->created[$uuid]);
  }

  /**
   * The teaser is attached to the host entity and field it was sent for.
   */
  public function testAttachesTeaserToTheGivenHostField(): void {
    $this->addTeaser('42');

    $this->assertCount(1, $this->context->proxies);
    $proxy = $this->context->proxies[0];
    $this->assertSame('node', $proxy->getHostEntityType());
    $this->assertSame(self::HOST_UUID, $proxy->getHostUuid());
    $this->assertSame('field_paragraphs', $proxy->getHostFieldName());
    $this->assertCount(1, $this->context->getProxiesForHost('node', self::HOST_UUID));
  }

  /**
   * Teasers go after the given paragraph, or first without one.
   */
  public function testPlacesTeaserAfterTheGivenParagraph(): void {
    $last = $this->addTeaser('1');
    $first = $this->addTeaser('2');
    $middle = $this->addTeaser('3', $first);

    $this->assertSame([$first, $middle, $last], $this->uuidsInContext());
  }

  /**
   * A replayed mutation keeps the UUID stored with it.
   *
   * The edit state replays every mutation on each request. A new UUID per
   * replay would detach later mutations that refer to this teaser.
   */
  public function testReplayKeepsTheStoredUuid(): void {
    $uuid = $this->addTeaser('42', NULL, ['new_paragraph_uuid_default' => 'stored-uuid']);

    $this->assertSame('stored-uuid', $uuid);
    $this->assertSame(['stored-uuid'], $this->uuidsInContext());
  }

}
