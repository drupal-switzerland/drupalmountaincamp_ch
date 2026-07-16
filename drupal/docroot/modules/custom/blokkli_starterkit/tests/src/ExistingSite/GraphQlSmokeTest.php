<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\ExistingSite;

use Drupal\node\NodeInterface;
use Drupal\user\Entity\User;

/**
 * A smoke test for the GraphQL endpoint.
 *
 * This indirectly tests that bundle classes are loading correctly.
 */
class GraphQlSmokeTest extends BlokkliStarterkitGraphQlExistingSiteTestBase {

  /**
   * A test user.
   */
  protected ?User $user;

  /**
   * An array of test content.
   *
   * @var \Drupal\Core\Entity\ContentEntityInterface[]
   */
  protected ?array $content = [];

  /**
   * {@inheritdoc}
   */
  public function setUp(): void {
    parent::setUp();
    $user = $this->setUpCurrentUser();
    assert($user instanceof User);
    $this->user = $user;
    $uuid_generator = \Drupal::service('uuid');
    $uuid = $uuid_generator->generate();
    $this->content[$uuid] = $this->createContent([
      'type' => 'page',
      'uuid' => $uuid,
      'title' => $this->getRandomGenerator()->sentences(3),
      'status' => TRUE,
    ]);
  }

  /**
   * Test node can be queried by graphQL.
   */
  public function testEntityCanBeQueried(): void {
    foreach ($this->content as $uuid => $content) {
      $metadata = $this->defaultCacheMetaData();
      $metadata->addCacheableDependency($content);
      $metadata->addCacheableDependency($this->server);
      $metadata->addCacheContexts(
        [
          'user.node_grants:view',
          'static:language:de',
          // Fix because of tmgmt module.
          'url.query_args:key',
        ]
      );
      $expected = $this->getExpectedResults($content);
      $queryFile = "query.get_{$content->bundle()}_by_uuid.graphql";
      $this->assertResults(
        $this->getQueryFromFile($queryFile),
        ['uuid' => $uuid],
        $expected,
        $metadata
      );
    }
  }

  /**
   * Returns the expected test results.
   *
   * @param \Drupal\node\NodeInterface $content
   *   The test content.
   *
   * @return array[]
   *   The results that are expected to be returned.
   */
  protected function getExpectedResults(NodeInterface $content): array {
    return [
      'entityByUuid' =>
        [
          'uuid' => $content->uuid(),
          'changed' => date(DATE_ATOM, (int) $content->getChangedTime()),
          'created' => date(DATE_ATOM, (int) $content->getCreatedTime()),
          'langcode' => $content->language()->getId(),
          'nid' => (int) $content->id(),
          'status' => $content->isPublished(),
          'title' => $content->getTitle(),
          'vid' => (int) $content->get('vid')->value,
        ],
    ];
  }

}
