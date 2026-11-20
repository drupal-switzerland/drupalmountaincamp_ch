<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Unit;

use Drupal\Component\Serialization\Yaml;
use Drupal\Tests\UnitTestCase;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the exported configuration of the GraphQL server.
 */
#[Group('blokkli_starterkit')]
class GraphqlServerConfigTest extends UnitTestCase {

  /**
   * Tests that the debugging extension is not enabled.
   *
   * Its requestHeaders field returns every request header, including the
   * token that Nuxt sends.
   */
  public function testDebuggingExtensionIsNotEnabled(): void {
    $config = Yaml::decode((string) file_get_contents($this->root . '/../config/default/graphql.graphql_servers.graphql.yml'));
    $extensions = $config['schema_configuration']['core_composable']['extensions'];

    $this->assertArrayHasKey('menu', $extensions);
    $this->assertArrayNotHasKey('debugging', $extensions);
  }

}
