<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Component\Serialization\Yaml;
use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\pathauto\Entity\PathautoPattern;
use Drupal\redirect\Entity\Redirect;
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
    'blokkli_starterkit',
    'field',
    'link',
    'menu_link_content',
    'menu_ui',
    'node',
    'path',
    'path_alias',
    'pathauto',
    'redirect',
    'system',
    'text',
    'token',
    'token_or',
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
    $this->installEntitySchema('menu_link_content');
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
   * After a second rename, both earlier addresses lead to the page.
   */
  public function testEveryEarlierAddressRedirectsAfterSecondRename(): void {
    $node = $this->createArticle('First name');
    $this->rename($node, 'Second name');
    $this->rename($node, 'Third name');

    $this->assertSame('/news/third-name', $this->aliasOf($node));
    foreach (['news/first-name', 'news/second-name'] as $earlier) {
      $redirect = $this->redirectFrom($earlier);
      $this->assertNotNull($redirect, "No redirect from $earlier.");
      $this->assertSame('internal:/node/' . $node->id(), $redirect->getRedirect()['uri']);
    }
    $this->assertNull($this->redirectFrom('news/third-name'));
  }

  /**
   * A second rename invalidates the cached answer of the first address.
   *
   * That answer holds the address the page had when it was cached.
   */
  public function testSecondRenameInvalidatesEarlierRedirects(): void {
    $node = $this->createArticle('First name');
    $this->rename($node, 'Second name');
    $first = $this->redirectFrom('news/first-name');
    $checksum = $this->container->get('cache_tags.invalidator.checksum');
    $before = $checksum->getCurrentChecksum($first->getCacheTags());

    $this->rename($node, 'Third name');

    $checksum->reset();
    $this->assertNotSame($before, $checksum->getCurrentChecksum($first->getCacheTags()));
  }

  /**
   * Renaming back leaves one redirect, from the name given up.
   */
  public function testRenamingBackLeavesNoLoop(): void {
    $node = $this->createArticle('First name');
    $this->rename($node, 'Second name');
    $this->rename($node, 'First name');

    $this->assertSame('/news/first-name', $this->aliasOf($node));
    $this->assertNull($this->redirectFrom('news/first-name'));
    $this->assertNotNull($this->redirectFrom('news/second-name'));
    $this->assertCount(1, $this->container->get('entity_type.manager')->getStorage('redirect')->loadMultiple());
  }

  /**
   * A new page that takes an old address is reachable there.
   */
  public function testNewPageTakesOverAnOldAddress(): void {
    $node = $this->createArticle('First name');
    $this->rename($node, 'Second name');

    $newcomer = $this->createArticle('First name');

    $this->assertSame('/news/first-name', $this->aliasOf($newcomer));
    $this->assertNull($this->redirectFrom('news/first-name'));
    $this->assertSame('/news/second-name', $this->aliasOf($node));
  }

  /**
   * A basic page, whose address follows its title, redirects after a rename.
   */
  public function testBasicPageRedirectsAfterRename(): void {
    NodeType::create(['type' => 'page', 'name' => 'Page'])->save();
    PathautoPattern::create($this->exportedConfig('pathauto.pattern.basic_page'))->save();
    $node = Node::create(['type' => 'page', 'title' => 'Travel guide']);
    $node->save();
    $this->assertSame('/travel-guide', $this->aliasOf($node));

    $this->rename($node, 'Getting there');

    $this->assertSame('/getting-there', $this->aliasOf($node));
    $redirect = $this->redirectFrom('travel-guide');
    $this->assertNotNull($redirect, 'No redirect from the old address.');
    $this->assertSame('internal:/node/' . $node->id(), $redirect->getRedirect()['uri']);
  }

  /**
   * Creates a saved news article.
   */
  private function createArticle(string $title): Node {
    $node = Node::create(['type' => 'press_release', 'title' => $title]);
    $node->save();
    return $node;
  }

  /**
   * Gives a node a new title and saves it.
   */
  private function rename(Node $node, string $title): void {
    $node->setTitle($title);
    $node->save();
  }

  /**
   * The redirect the lookup of the route query finds for a path.
   */
  private function redirectFrom(string $path): ?Redirect {
    return $this->container->get('redirect.repository')->findMatchingRedirect($path, [], 'en');
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
