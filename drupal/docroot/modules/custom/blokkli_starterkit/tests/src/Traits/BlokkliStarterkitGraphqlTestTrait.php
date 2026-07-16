<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Traits;

use Drupal\Tests\graphql\Traits\QueryFileTrait;
use Drupal\Tests\graphql\Traits\QueryResultAssertionTrait;
use Drupal\graphql\Entity\ServerInterface;

/**
 * A test trait to support GraphQL tests.
 */
trait BlokkliStarterkitGraphqlTestTrait {

  use QueryFileTrait;
  use QueryResultAssertionTrait;

  /**
   * Load the graphQL server.
   *
   * @return \Drupal\graphql\Entity\ServerInterface
   *   The graphQL server to query.
   */
  protected function getServer(): ServerInterface {
    $entityTypeManager = \Drupal::entityTypeManager();
    $serverStorage = $entityTypeManager->getStorage('graphql_server');
    $servers = $serverStorage->loadMultiple();
    $server = $servers['graphql'] ?? $servers['graphql_compose_server'] ?? NULL;
    assert($server instanceof ServerInterface);
    return $server;
  }

}
