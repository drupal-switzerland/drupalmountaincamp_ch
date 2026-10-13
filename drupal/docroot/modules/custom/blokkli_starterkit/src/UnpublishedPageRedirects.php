<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit;

use Drupal\Core\StringTranslation\PluralTranslatableMarkup;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\node\NodeInterface;
use Drupal\path_alias\PathAliasInterface;
use Drupal\redirect\Entity\Redirect;

/**
 * Keeps the address of an unpublished page out of redirects.
 *
 * A redirect is answered with the current address of its page before any
 * access check. Renaming an unpublished page would so tell every visitor of
 * an old address what the page is called now.
 *
 * The new redirect is deleted inside its own insert hook. Hook
 * implementations of other modules that run after this one receive an entity
 * whose row is already gone; entity_usage and the search indexes, the ones
 * that track entities here, don't track redirects.
 */
final class UnpublishedPageRedirects {

  /**
   * Message kind: redirects that existed before this save were removed.
   */
  public const OLDER_REMOVED = 'older_removed';

  /**
   * Message kind: a redirect somebody made by hand was not kept.
   */
  public const BY_HAND_NOT_KEPT = 'by_hand_not_kept';

  private const NODE_TARGET = '#^(?:internal:/|entity:)node/(\d+)$#';

  /**
   * The address an alias is being changed from, without the leading slash.
   *
   * The redirect module creates a redirect from it in the same alias update.
   */
  private static ?string $aliasBeingReplaced = NULL;

  /**
   * Remembers the address an alias is changed from.
   *
   * Called from this module's path_alias update hook, which runs before the
   * redirect module's: both modules have weight 0 and hooks then run in
   * alphabetical order.
   */
  public static function aliasUpdating(PathAliasInterface $alias): void {
    $original = $alias->original ?? NULL;
    self::$aliasBeingReplaced = $original instanceof PathAliasInterface
      ? ltrim($original->getAlias(), '/')
      : NULL;
  }

  /**
   * Deletes all redirects to the page of a new redirect, if it's unpublished.
   *
   * Runs when a redirect is created, whoever creates it, so no redirect to an
   * unpublished page outlives its own creation. The page is read from
   * storage. The default translation decides, and redirects of every language
   * go, since one without a language forwards for all of them.
   */
  public static function redirectCreated(Redirect $redirect): void {
    // Only the first redirect after an alias update can be the automatic one.
    $replaced = self::$aliasBeingReplaced;
    self::$aliasBeingReplaced = NULL;
    try {
      $uri = $redirect->getRedirect()['uri'] ?? '';
      if (!preg_match(self::NODE_TARGET, $uri, $match)) {
        return;
      }
      $node = \Drupal::entityTypeManager()->getStorage('node')->loadUnchanged($match[1]);
      if (!$node instanceof NodeInterface || $node->isPublished()) {
        return;
      }
      $redirects = \Drupal::service('redirect.repository')->findByDestinationUri([
        'internal:/node/' . $node->id(),
        'entity:node/' . $node->id(),
      ]);
      $older = 0;
      foreach ($redirects as $other) {
        $older += (int) ($other->id() !== $redirect->id());
        $other->delete();
      }
      // The stored path, not the generated URL, which is encoded and carries
      // the base path.
      $from_alias_change = $replaced !== NULL
        && ltrim($redirect->getSource()['path'] ?? '', '/') === $replaced;
      self::report($node, count($redirects), $older, $from_alias_change);
    }
    catch (\Throwable $error) {
      \Drupal::logger('blokkli_starterkit')->error(
        'Redirects to an unpublished page could not be removed: @message',
        ['@message' => $error->getMessage()],
      );
    }
  }

  /**
   * Which messages the person who caused a removal gets.
   *
   * None when the only redirect removed is the one a rename just created:
   * nothing they had is lost.
   *
   * @return string[]
   *   Message kinds, see the constants.
   */
  public static function messageKinds(int $older_removed, bool $new_one_from_alias_change): array {
    return array_values(array_filter([
      $new_one_from_alias_change ? NULL : self::BY_HAND_NOT_KEPT,
      $older_removed > 0 ? self::OLDER_REMOVED : NULL,
    ]));
  }

  /**
   * Logs every removal and tells the person at the screen what they lost.
   *
   * The session condition means "a message can be queued", not "an editor is
   * present": queuing without a session throws, drush has one and prints the
   * message, and a web request has a session object for anonymous visitors
   * too. A message queued for an anonymous request would start a session and
   * set a cookie; nothing anonymous can change an alias or create a redirect
   * here.
   */
  private static function report(NodeInterface $node, int $removed, int $older, bool $from_alias_change): void {
    if ($removed === 0) {
      return;
    }
    \Drupal::logger('blokkli_starterkit')->notice(
      'Removed @count redirect(s) to the unpublished page "@title" (node @id).',
      ['@count' => $removed, '@title' => $node->label(), '@id' => $node->id()],
    );
    $request = \Drupal::requestStack()->getCurrentRequest();
    if (!$request || !$request->hasSession()) {
      return;
    }
    $title = ['@title' => $node->label()];
    $messages = [
      self::BY_HAND_NOT_KEPT => new TranslatableMarkup('The redirect to "@title" was not kept, because the page is not published and a redirect would show its address. Add it again after the page is published.', $title),
      self::OLDER_REMOVED => new PluralTranslatableMarkup(
        $older,
        'One older redirect to "@title" was removed, because the page is not published and a redirect would show its address. Add it again after the page is published.',
        '@count older redirects to "@title" were removed, because the page is not published and a redirect would show its address. Add them again after the page is published.',
        $title,
      ),
    ];
    foreach (self::messageKinds($older, $from_alias_change) as $kind) {
      \Drupal::messenger()->addWarning($messages[$kind]);
    }
  }

}
