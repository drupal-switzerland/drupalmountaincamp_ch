<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Component\Serialization\Yaml;
use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\pathauto\Entity\PathautoPattern;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that a renamed page stays reachable at its old address.
 *
 * Uses the site's exported redirect and pathauto settings and the exported
 * alias pattern of news articles.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class RenamedPageRedirectTest extends KernelTestBase {

  private const CONFIG_DIRECTORY = DRUPAL_ROOT . '/../config/default';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'field',
    'link',
    'node',
    'path',
    'path_alias',
    'pathauto',
    'redirect',
    'system',
    'text',
    'token',
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
    $this->installEntitySchema('path_alias');
    $this->installEntitySchema('redirect');
    $this->installSchema('node', ['node_access']);
    $this->installConfig(['system', 'node', 'pathauto']);

    NodeType::create(['type' => 'press_release', 'name' => 'News'])->save();
    foreach (['redirect.settings', 'pathauto.settings'] as $name) {
      $this->config($name)->setData($this->exportedConfig($name))->save();
    }
    PathautoPattern::create($this->exportedConfig('pathauto.pattern.node_press_release_en'))->save();
  }

  /**
   * After a rename, the old address redirects to the page.
   */
  public function testOldAddressRedirectsAfterRename(): void {
    $node = Node::create(['type' => 'press_release', 'title' => 'Keynotes confirmed']);
    $node->save();
    $this->assertSame('/news/keynotes-confirmed', $this->aliasOf($node));

    $node->setTitle('Keynote speakers announced');
    $node->save();

    $this->assertSame('/news/keynote-speakers-announced', $this->aliasOf($node));
    $redirect = $this->container->get('redirect.repository')
      ->findMatchingRedirect('news/keynotes-confirmed', [], 'en');
    $this->assertNotNull($redirect, 'No redirect from the old address.');
    $this->assertSame('internal:/node/' . $node->id(), $redirect->getRedirect()['uri']);
    $this->assertSame(301, (int) $redirect->getStatusCode());
  }

  /**
   * A page that keeps its title gets no redirect.
   */
  public function testNoRedirectWithoutRename(): void {
    $node = Node::create(['type' => 'press_release', 'title' => 'Keynotes confirmed']);
    $node->save();
    $node->save();

    $this->assertSame([], $this->container->get('entity_type.manager')->getStorage('redirect')->loadMultiple());
  }

  /**
   * The current alias of a node.
   */
  private function aliasOf(Node $node): string {
    $manager = $this->container->get('path_alias.manager');
    $manager->cacheClear();
    return $manager->getAliasByPath('/node/' . $node->id());
  }

  /**
   * Reads a config object from the site's exported configuration.
   *
   * @return array<string, mixed>
   *   The config data.
   */
  private function exportedConfig(string $name): array {
    return Yaml::decode((string) file_get_contents(self::CONFIG_DIRECTORY . "/$name.yml"));
  }

}
