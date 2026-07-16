<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\ExistingSite;

use Drupal\Core\Cache\Cache;
use Drupal\Core\Cache\CacheableMetadata;
use Drupal\Core\Render\RenderContext;
use Drupal\Tests\blokkli_starterkit\Traits\BlokkliStarterkitGraphqlTestTrait;
use Drupal\graphql\GraphQL\Execution\ExecutionResult;
use GraphQL\Server\OperationParams;

/**
 * Base class for existing site tests that execute GraphQL queries.
 */
abstract class BlokkliStarterkitGraphQlExistingSiteTestBase extends BlokkliStarterkitExistingSiteBase {

  use BlokkliStarterkitGraphqlTestTrait;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->server = $this->getServer();
  }

  /**
   * Returns the result of a GraphQL query.
   *
   * @param string $query
   *   The query to execute.
   * @param array $variables
   *   The query variables.
   *
   * @return \Drupal\graphql\GraphQL\Execution\ExecutionResult
   *   The result of the query.
   */
  protected function getQueryResult(string $query, array $variables = []): ExecutionResult {
    $context = new RenderContext();
    $query_params = OperationParams::create([
      'query' => $query,
      'variables' => $variables,
    ]);

    return $this->getRenderer()->executeInRenderContext(
      $context,
      fn () => $this->server->executeOperation($query_params),
    );
  }

  /**
   * Asserts a certain set of result metadata on a query result.
   *
   * Copied from QueryResultAssertionTrait, visibility changed to protected.
   *
   * @param \Drupal\graphql\GraphQL\Execution\ExecutionResult $result
   *   The query result object.
   * @param \Drupal\Core\Cache\CacheableMetadata $expected
   *   The expected metadata object.
   *
   * @see \Drupal\Tests\graphql\Traits\QueryResultAssertionTrait::assertResultMetadata()
   */
  protected function assertResultMetadata(ExecutionResult $result, CacheableMetadata $expected): void {
    $this->assertEquals($expected->getCacheMaxAge(), $result->getCacheMaxAge(), 'Unexpected cache max age.');

    $missingContexts = array_diff($expected->getCacheContexts(), $result->getCacheContexts());
    $this->assertEmpty($missingContexts, 'Missing cache contexts: ' . implode(', ', $missingContexts));

    $unexpectedContexts = array_diff($result->getCacheContexts(), $expected->getCacheContexts());
    $this->assertEmpty($unexpectedContexts, 'Unexpected cache contexts: ' . implode(', ', $unexpectedContexts));

    $missingTags = array_diff($expected->getCacheTags(), $result->getCacheTags());
    $this->assertEmpty($missingTags, 'Missing cache tags: ' . implode(', ', $missingTags));

    $unexpectedTags = array_diff($result->getCacheTags(), $expected->getCacheTags());
    $this->assertEmpty($unexpectedTags, 'Unexpected cache tags: ' . implode(', ', $unexpectedTags));
  }

  /**
   * {@inheritdoc}
   */
  protected function defaultCacheMaxAge() {
    return Cache::PERMANENT;
  }

  /**
   * {@inheritdoc}
   */
  protected function defaultCacheTags() {
    return Cache::mergeTags([
      'graphql_response',
    ], $this->server->getCacheTags());
  }

  /**
   * {@inheritdoc}
   */
  protected function defaultCacheContexts() {
    return [
      'user.permissions',
      'languages:language_interface',
    ];
  }

}
