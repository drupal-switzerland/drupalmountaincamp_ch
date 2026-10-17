<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\blokkli_starterkit\UnpublishedPageRedirects;
use Drupal\Component\Serialization\Yaml;
use Drupal\Core\Messenger\MessengerInterface;
use Drupal\KernelTests\KernelTestBase;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\pathauto\Entity\PathautoPattern;
use Drupal\pathauto\PathautoState;
use Drupal\redirect\Entity\Redirect;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Session\Session;
use Symfony\Component\HttpFoundation\Session\Storage\MockArraySessionStorage;

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
   * An article that was never published has no redirect after a rename.
   *
   * A redirect would tell visitors of the old address the new one.
   */
  public function testUnpublishedPageGetsNoRedirect(): void {
    $node = $this->createArticle('First name', FALSE);
    $this->rename($node, 'Second name');

    $this->assertSame('/news/second-name', $this->aliasOf($node));
    $this->assertNull($this->redirectFrom('news/first-name'));
    $this->assertSame([], $this->container->get('entity_type.manager')->getStorage('redirect')->loadMultiple());
  }

  /**
   * Renaming a page after unpublishing it removes its earlier redirects too.
   *
   * They would be answered with the page's new address.
   */
  public function testRenameWhileUnpublishedRemovesEarlierRedirects(): void {
    $node = $this->createArticle('First name');
    $this->rename($node, 'Second name');
    $this->assertNotNull($this->redirectFrom('news/first-name'));

    $node->setUnpublished()->save();
    $this->rename($node, 'Third name');

    $this->assertNull($this->redirectFrom('news/first-name'));
    $this->assertNull($this->redirectFrom('news/second-name'));
  }

  /**
   * Unpublishing and publishing again without a rename keeps the redirects.
   */
  public function testUnpublishingAloneKeepsRedirects(): void {
    $node = $this->createArticle('First name');
    $this->rename($node, 'Second name');

    $node->setUnpublished()->save();
    $node->setPublished()->save();

    $this->assertNotNull($this->redirectFrom('news/first-name'));
  }

  /**
   * Redirects of other pages are left alone.
   */
  public function testRedirectsOfOtherPagesAreKept(): void {
    $published = $this->createArticle('Public first');
    $this->rename($published, 'Public second');
    $draft = $this->createArticle('Draft first', FALSE);

    $this->rename($draft, 'Draft second');

    $this->assertNotNull($this->redirectFrom('news/public-first'));
    $this->assertNull($this->redirectFrom('news/draft-first'));
  }

  /**
   * Unpublishing and changing a hand-written address in one save.
   *
   * As the node form does: the saved object is a clone of the loaded one, so
   * the entity cache still holds the published node while the alias is
   * written.
   */
  public function testUnpublishAndManualAliasChangeInOneSave(): void {
    $node = Node::create([
      'type' => 'press_release',
      'title' => 'Speaker confirmed',
      'path' => ['alias' => '/speaker-confirmed', 'pathauto' => PathautoState::SKIP],
    ]);
    $node->save();

    $edited = clone $this->container->get('entity_type.manager')->getStorage('node')->load($node->id());
    $edited->setUnpublished();
    $edited->get('path')->alias = '/speaker-cancelled';
    $edited->save();

    $this->assertSame('/speaker-cancelled', $this->aliasOf($node));
    $this->assertNull($this->redirectFrom('speaker-confirmed'));
  }

  /**
   * Publishing and changing a hand-written address in one save keeps it.
   */
  public function testPublishAndManualAliasChangeInOneSave(): void {
    $node = Node::create([
      'type' => 'press_release',
      'title' => 'Speaker confirmed',
      'status' => 0,
      'path' => ['alias' => '/speaker-draft', 'pathauto' => PathautoState::SKIP],
    ]);
    $node->save();

    $edited = clone $this->container->get('entity_type.manager')->getStorage('node')->load($node->id());
    $edited->setPublished();
    $edited->get('path')->alias = '/speaker-confirmed';
    $edited->save();

    $this->assertNotNull($this->redirectFrom('speaker-draft'));
  }

  /**
   * A hand-made redirect without a language is removed with the others.
   */
  public function testRedirectWithoutLanguageIsRemovedToo(): void {
    $node = $this->createArticle('First name');
    $by_hand = Redirect::create();
    $by_hand->setSource('tickets');
    $by_hand->setRedirect('node/' . $node->id());
    $by_hand->setLanguage('und');
    $by_hand->setStatusCode(301);
    $by_hand->save();
    $this->assertNotNull(Redirect::load($by_hand->id()));

    $node->setUnpublished()->save();
    $this->rename($node, 'Second name');

    $this->assertNull($this->redirectFrom('tickets'));
    $this->assertNull($this->redirectFrom('news/first-name'));
  }

  /**
   * Retitling a draft tells its editor nothing: nothing they had is lost.
   */
  public function testRetitledDraftGivesNoMessage(): void {
    $this->someoneIsAtTheScreen();
    $node = $this->createArticle('First name', FALSE);

    $this->rename($node, 'Second name');

    $this->assertNull($this->redirectFrom('news/first-name'));
    $this->assertSame([], $this->warnings());
  }

  /**
   * An address with an umlaut or a space is recognised as the one replaced.
   *
   * Otherwise the redirect of an ordinary save would count as made by hand.
   */
  public function testChangedDraftAddressWithSpecialCharactersGivesNoMessage(): void {
    $this->someoneIsAtTheScreen();
    $node = Node::create([
      'type' => 'press_release',
      'title' => 'About us',
      'status' => 0,
      'path' => ['alias' => '/über uns', 'pathauto' => PathautoState::SKIP],
    ]);
    $node->save();

    $edited = $this->container->get('entity_type.manager')->getStorage('node')->load($node->id());
    $edited->get('path')->alias = '/about-us';
    $edited->save();

    $this->assertSame('/about-us', $this->aliasOf($node));
    $this->assertSame([], $this->container->get('entity_type.manager')->getStorage('redirect')->loadMultiple());
    $this->assertSame([], $this->warnings());
  }

  /**
   * Losing earlier redirects is said, with their number.
   */
  public function testRemovedOlderRedirectsAreReported(): void {
    $this->someoneIsAtTheScreen();
    $node = $this->createArticle('First name');
    $this->rename($node, 'Second name');
    $node->setUnpublished()->save();

    $this->rename($node, 'Third name');

    $warnings = $this->warnings();
    $this->assertCount(1, $warnings);
    $this->assertStringStartsWith('One older redirect to "Third name" was removed', $warnings[0]);
  }

  /**
   * A hand-made redirect to an unpublished page is not kept, and that is said.
   */
  public function testHandMadeRedirectToDraftIsReported(): void {
    $this->someoneIsAtTheScreen();
    $node = $this->createArticle('Launch page', FALSE);

    $by_hand = Redirect::create();
    $by_hand->setSource('tickets');
    $by_hand->setRedirect('node/' . $node->id());
    $by_hand->setLanguage('und');
    $by_hand->setStatusCode(301);
    $by_hand->save();

    $this->assertNull(Redirect::load($by_hand->id()));
    $warnings = $this->warnings();
    $this->assertCount(1, $warnings);
    $this->assertStringStartsWith('The redirect to "Launch page" was not kept', $warnings[0]);
  }

  /**
   * Without a session there is nobody to tell, and the rule still applies.
   *
   * Queuing a message without a session throws.
   */
  public function testNoMessageWithoutSomeoneAtTheScreen(): void {
    $node = $this->createArticle('First name');
    $this->rename($node, 'Second name');
    $node->setUnpublished()->save();

    // The test's own teardown needs the request with a session back.
    $requests = $this->container->get('request_stack');
    $requests->push(Request::create('/'));
    try {
      $this->rename($node, 'Third name');
    }
    finally {
      $requests->pop();
    }

    $this->assertSame('/news/third-name', $this->aliasOf($node));
    $this->assertNull($this->redirectFrom('news/first-name'));
    $this->assertNull($this->redirectFrom('news/second-name'));
  }

  /**
   * The rule reads the alias before the change without the magic property.
   *
   * Drupal 12 removes the property, and every retitled draft would then get
   * the "not kept" warning.
   */
  public function testRenameUsesNoDeprecatedOriginalProperty(): void {
    $node = $this->createArticle('First name', FALSE);

    $deprecations = $this->ownDeprecationsDuring(fn () => $this->rename($node, 'Second name'));

    $this->assertSame([], $deprecations);
  }

  /**
   * A redirect changed to point at an unpublished page is not kept.
   */
  public function testRedirectRetargetedToDraftIsRemoved(): void {
    $this->someoneIsAtTheScreen();
    $published = $this->createArticle('Published page');
    $draft = $this->createArticle('Draft page', FALSE);
    $by_hand = $this->createRedirect('tickets', 'node/' . $published->id());

    $by_hand->setRedirect('node/' . $draft->id());
    $by_hand->save();

    $this->assertNull(Redirect::load($by_hand->id()));
    $warnings = $this->warnings();
    $this->assertCount(1, $warnings);
    $this->assertStringStartsWith('The redirect to "Draft page" was not kept', $warnings[0]);
  }

  /**
   * Editing a redirect without changing its page keeps it.
   *
   * A page unpublished without a rename keeps its redirects.
   */
  public function testEditingRedirectOfUnpublishedPageKeepsIt(): void {
    $node = $this->createArticle('First name');
    $by_hand = $this->createRedirect('tickets', 'node/' . $node->id());
    $node->setUnpublished()->save();

    $by_hand->setStatusCode(302);
    $by_hand->save();

    $this->assertNotNull(Redirect::load($by_hand->id()));
  }

  /**
   * A disabled redirect goes with the others.
   *
   * Enabled later, it would show the new address.
   */
  public function testDisabledRedirectIsRemovedToo(): void {
    $node = $this->createArticle('First name');
    $disabled = $this->createRedirect('tickets', 'node/' . $node->id());
    $disabled->setUnpublished();
    $disabled->save();
    $node->setUnpublished()->save();

    $this->rename($node, 'Second name');

    $this->assertNull(Redirect::load($disabled->id()));
  }

  /**
   * A disabled redirect from the old address counts as an older one.
   */
  public function testDisabledRedirectFromOldAddressIsReported(): void {
    $node = $this->createArticle('First name');
    $disabled = $this->createRedirect('news/first-name', 'node/' . $node->id());
    $disabled->setUnpublished();
    $disabled->save();
    $node->setUnpublished()->save();
    $this->someoneIsAtTheScreen();

    $this->rename($node, 'Second name');

    $this->assertNull(Redirect::load($disabled->id()));
    $warnings = $this->warnings();
    $this->assertCount(1, $warnings);
    $this->assertStringStartsWith('One older redirect to "Second name" was removed', $warnings[0]);
  }

  /**
   * A redirect to an unpublished page with a query string is not kept.
   */
  public function testRedirectWithQueryToDraftIsRemoved(): void {
    $node = $this->createArticle('Launch page', FALSE);

    $by_hand = $this->createRedirect('tickets', 'node/' . $node->id(), ['ref' => 'newsletter']);

    $this->assertNull(Redirect::load($by_hand->id()));
  }

  /**
   * A redirect to an unpublished page given by its address is not kept.
   *
   * The redirect form stores a target typed as the page's address as is.
   */
  public function testRedirectToDraftByAliasIsRemoved(): void {
    $this->someoneIsAtTheScreen();
    $node = $this->createArticle('Launch page', FALSE);
    $this->assertSame('/news/launch-page', $this->aliasOf($node));

    $by_hand = $this->createRedirect('tickets', 'news/launch-page');

    $this->assertSame('internal:/news/launch-page', $by_hand->getRedirect()['uri']);
    $this->assertNull(Redirect::load($by_hand->id()));
    $warnings = $this->warnings();
    $this->assertCount(1, $warnings);
    $this->assertStringStartsWith('The redirect to "Launch page" was not kept', $warnings[0]);
  }

  /**
   * The same with a query string and a fragment after the address.
   */
  public function testRedirectToDraftByAliasWithQueryAndFragmentIsRemoved(): void {
    $node = $this->createArticle('Launch page', FALSE);

    $by_hand = $this->createRedirect('tickets', 'news/launch-page', ['ref' => 'newsletter']);
    $with_fragment = $this->createRedirect('tickets-faq', 'news/launch-page#faq');

    $this->assertSame('/news/launch-page', $this->aliasOf($node));
    $this->assertNull(Redirect::load($by_hand->id()));
    $this->assertNull(Redirect::load($with_fragment->id()));
  }

  /**
   * A redirect to a published page given by its address is kept.
   */
  public function testRedirectToPublishedPageByAliasIsKept(): void {
    $this->createArticle('Launch page');

    $by_hand = $this->createRedirect('tickets', 'news/launch-page');

    $this->assertNotNull(Redirect::load($by_hand->id()));
  }

  /**
   * A redirect changed to point at an unpublished page by its address goes.
   */
  public function testRedirectRetargetedToDraftByAliasIsRemoved(): void {
    $published = $this->createArticle('Published page');
    $this->createArticle('Draft page', FALSE);
    $by_hand = $this->createRedirect('tickets', 'node/' . $published->id());

    $by_hand->setRedirect('news/draft-page');
    $by_hand->save();

    $this->assertNull(Redirect::load($by_hand->id()));
  }

  /**
   * A redirect to an address that is no page is left alone.
   */
  public function testRedirectToUnknownAddressIsKept(): void {
    $by_hand = $this->createRedirect('tickets', 'no-such-page');

    $this->assertNotNull(Redirect::load($by_hand->id()));
  }

  /**
   * An older redirect with a query string goes with the others on a rename.
   */
  public function testOlderRedirectWithQueryIsRemovedOnRename(): void {
    $node = $this->createArticle('First name');
    $by_hand = $this->createRedirect('tickets', 'node/' . $node->id(), ['ref' => 'newsletter']);
    $node->setUnpublished()->save();

    $this->rename($node, 'Second name');

    $this->assertNull(Redirect::load($by_hand->id()));
  }

  /**
   * A redirect to another page whose number starts the same is kept.
   */
  public function testRedirectToPageWithLongerNumberIsKept(): void {
    $nodes = array_map(fn ($i) => $this->createArticle("Page $i"), range(1, 10));
    $kept = $this->createRedirect('tickets', 'node/' . $nodes[9]->id());
    $nodes[0]->setUnpublished()->save();

    $this->rename($nodes[0], 'Renamed');

    $this->assertSame('10', (string) $nodes[9]->id());
    $this->assertNotNull(Redirect::load($kept->id()));
  }

  /**
   * Which messages a removal gives.
   */
  public function testMessageKinds(): void {
    $this->assertSame([], UnpublishedPageRedirects::messageKinds(0, TRUE));
    $this->assertSame([UnpublishedPageRedirects::OLDER_REMOVED], UnpublishedPageRedirects::messageKinds(2, TRUE));
    $this->assertSame([UnpublishedPageRedirects::BY_HAND_NOT_KEPT], UnpublishedPageRedirects::messageKinds(0, FALSE));
    $this->assertSame(
      [UnpublishedPageRedirects::BY_HAND_NOT_KEPT, UnpublishedPageRedirects::OLDER_REMOVED],
      UnpublishedPageRedirects::messageKinds(1, FALSE),
    );
  }

  /**
   * Gives the current request a session, as a request from a browser has.
   */
  private function someoneIsAtTheScreen(): void {
    $request = Request::create('/');
    $request->setSession(new Session(new MockArraySessionStorage()));
    $this->container->get('request_stack')->push($request);
  }

  /**
   * The warning messages queued for the person at the screen.
   *
   * @return string[]
   *   The messages as text.
   */
  private function warnings(): array {
    return array_map('strval', $this->container->get('messenger')->messagesByType(MessengerInterface::TYPE_WARNING));
  }

  /**
   * Creates a saved news article.
   */
  private function createArticle(string $title, bool $published = TRUE): Node {
    $node = Node::create(['type' => 'press_release', 'title' => $title, 'status' => (int) $published]);
    $node->save();
    return $node;
  }

  /**
   * Creates a saved redirect for all languages.
   *
   * @param string $source
   *   The path redirected from.
   * @param string $target
   *   The path redirected to.
   * @param array<string, string> $query
   *   Query parameters added to the target.
   */
  private function createRedirect(string $source, string $target, array $query = []): Redirect {
    $redirect = Redirect::create();
    $redirect->setSource($source);
    $redirect->setRedirect($target, $query);
    $redirect->setLanguage('und');
    $redirect->setStatusCode(301);
    $redirect->save();
    return $redirect;
  }

  /**
   * Deprecations raised from this module's code while an action runs.
   *
   * PHPUnit hides deprecations raised with @trigger_error, as core's magic
   * property access does, and phpstan cannot see magic properties.
   *
   * @return string[]
   *   The deprecation messages.
   */
  private function ownDeprecationsDuring(callable $action): array {
    $messages = [];
    set_error_handler(function (int $level, string $message) use (&$messages): bool {
      $files = array_column(debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS), 'file');
      $from_here = array_filter($files, fn ($file) => str_contains($file, '/blokkli_starterkit/src/'));
      if ($level === E_USER_DEPRECATED && $from_here) {
        $messages[] = $message;
      }
      return TRUE;
    }, E_USER_DEPRECATED);
    try {
      $action();
    }
    finally {
      restore_error_handler();
    }
    return $messages;
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
