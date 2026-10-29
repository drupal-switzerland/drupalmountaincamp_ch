<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\tmgmt\JobInterface;
use Drupal\tmgmt\JobItemInterface;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests blokkli_starterkit_post_update_delete_tmgmt_jobs().
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class DeleteTmgmtJobsUpdateTest extends KernelTestBase {

  /**
   * The translator of the jobs on production, which no longer exists.
   */
  private const MISSING_TRANSLATOR = 'deepl_pro';

  private const TMGMT_ENTITY_TYPES = [
    'tmgmt_job',
    'tmgmt_job_item',
    'tmgmt_message',
    'tmgmt_remote',
  ];

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'block',
    'field',
    'filter',
    'language',
    'node',
    'options',
    'system',
    'text',
    'tmgmt',
    'user',
    'views',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installEntitySchema('node');
    foreach (self::TMGMT_ENTITY_TYPES as $entityTypeId) {
      $this->installEntitySchema($entityTypeId);
    }
    $this->installConfig(['filter', 'node']);
    NodeType::create(['type' => 'page', 'name' => 'Page'])->save();
    require_once __DIR__ . '/../../../blokkli_starterkit.post_update.php';
  }

  /**
   * Creates an entity of the given type and saves it.
   */
  private function createEntity(string $entityTypeId, array $values): int {
    $entity = $this->container->get('entity_type.manager')->getStorage($entityTypeId)->create($values);
    $entity->save();
    return (int) $entity->id();
  }

  /**
   * Counts the entities of the given type, without access checks.
   */
  private function countEntities(string $entityTypeId): int {
    return (int) $this->container->get('entity_type.manager')->getStorage($entityTypeId)
      ->getQuery()
      ->accessCheck(FALSE)
      ->count()
      ->execute();
  }

  /**
   * Runs the update to the end, as the update runner does.
   */
  private function runUpdate(): string {
    $sandbox = [];
    do {
      $message = blokkli_starterkit_post_update_delete_tmgmt_jobs($sandbox);
    } while ($sandbox['#finished'] < 1);
    return $message;
  }

  /**
   * Creates a job with one item for a node, and messages for both.
   */
  private function createJob(int $jobState, int $itemState, int $nodeId, int $messageCount): void {
    $jobId = $this->createEntity('tmgmt_job', [
      'translator' => self::MISSING_TRANSLATOR,
      'source_language' => 'de',
      'target_language' => 'en',
      'state' => $jobState,
    ]);
    $itemId = $this->createEntity('tmgmt_job_item', [
      'tjid' => $jobId,
      'plugin' => 'content',
      'item_type' => 'node',
      'item_id' => $nodeId,
      'state' => $itemState,
    ]);
    for ($i = 0; $i < $messageCount; $i++) {
      $this->createEntity('tmgmt_message', [
        'tjid' => $jobId,
        'tjiid' => $i % 2 ? $itemId : NULL,
        'message' => 'Message @number',
        'variables' => ['@number' => $i],
        'type' => 'status',
      ]);
    }
  }

  /**
   * Jobs with a missing translator, their items and messages are deleted.
   *
   * The jobs have the shape of the ones on production: finished, with an
   * accepted node item each and a translator that no longer exists. One more
   * job is still active, and a message and a remote mapping belong to no job.
   */
  public function testDeletesJobsWithMissingTranslator(): void {
    $node = Node::create(['type' => 'page', 'title' => 'Translated page']);
    $node->save();
    $missingNodeId = 999;

    $messagesPerJob = [4, 3, 3, 3, 3];
    foreach ($messagesPerJob as $index => $messageCount) {
      $this->createJob(JobInterface::STATE_FINISHED, JobItemInterface::STATE_ACCEPTED, $index === 0 ? (int) $node->id() : $missingNodeId, $messageCount);
    }
    $this->createJob(JobInterface::STATE_ACTIVE, JobItemInterface::STATE_ACTIVE, (int) $node->id(), 1);
    $this->createEntity('tmgmt_message', ['tjid' => 12345, 'message' => 'Orphan', 'type' => 'status']);
    $this->createEntity('tmgmt_remote', ['tjid' => 12345, 'tjiid' => 54321, 'data_item_key' => 'orphan']);

    $this->assertNull($this->container->get('entity_type.manager')->getStorage('tmgmt_translator')->load(self::MISSING_TRANSLATOR));
    $this->assertSame(6, $this->countEntities('tmgmt_job'));
    $this->assertSame(6, $this->countEntities('tmgmt_job_item'));
    $this->assertSame(18, $this->countEntities('tmgmt_message'));
    $this->assertSame(1, $this->countEntities('tmgmt_remote'));

    $message = $this->runUpdate();

    foreach (self::TMGMT_ENTITY_TYPES as $entityTypeId) {
      $this->assertSame(0, $this->countEntities($entityTypeId), $entityTypeId);
    }
    $this->assertSame('Deleted TMGMT entities (tmgmt_job: 6, tmgmt_job_item: 6, tmgmt_message: 18, tmgmt_remote: 1).', $message);
    $this->assertNotNull(Node::load($node->id()), 'The node the job translated is kept.');
  }

  /**
   * More jobs than one batch takes are all deleted.
   */
  public function testDeletesInBatches(): void {
    $jobCount = 120;
    for ($i = 0; $i < $jobCount; $i++) {
      $this->createEntity('tmgmt_job', [
        'translator' => self::MISSING_TRANSLATOR,
        'source_language' => 'de',
        'target_language' => 'en',
        'state' => JobInterface::STATE_FINISHED,
      ]);
    }

    $sandbox = [];
    blokkli_starterkit_post_update_delete_tmgmt_jobs($sandbox);
    $this->assertSame(0, $sandbox['#finished'], 'The first call leaves work for the next one.');

    $this->runUpdate();
    $this->assertSame(0, $this->countEntities('tmgmt_job'));
  }

  /**
   * Without jobs the update finishes at once.
   */
  public function testNothingToDelete(): void {
    $this->assertSame('Deleted TMGMT entities (tmgmt_job: 0, tmgmt_job_item: 0, tmgmt_message: 0, tmgmt_remote: 0).', $this->runUpdate());
  }

}
