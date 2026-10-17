<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit;

use Drupal\Core\Entity\EntityFormInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\StringTranslation\PluralTranslatableMarkup;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\Core\Url;
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
 * The redirect is deleted inside its own insert or update hook. Hook
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
    $original = $alias->getOriginal();
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
    // The stored path, not the generated URL, which is encoded and carries the
    // base path.
    $from_alias_change = $replaced !== NULL
      && ltrim($redirect->getSource()['path'] ?? '', '/') === $replaced;
    self::removeAllIfUnpublished($redirect, $from_alias_change);
  }

  /**
   * The same as on creation, for a redirect pointed at another page.
   *
   * Other edits keep it: a page unpublished without a rename keeps its
   * redirects.
   */
  public static function redirectChanged(Redirect $redirect): void {
    $original = $redirect->getOriginal();
    $target = $redirect->getRedirect()['uri'] ?? '';
    if ($original instanceof Redirect && ($original->getRedirect()['uri'] ?? '') === $target) {
      return;
    }
    self::removeAllIfUnpublished($redirect, FALSE);
  }

  /**
   * Deletes all redirects to the page of a redirect, if it's unpublished.
   */
  private static function removeAllIfUnpublished(Redirect $redirect, bool $from_alias_change): void {
    try {
      $node = self::targetNode($redirect->getRedirect()['uri'] ?? '');
      if (!$node instanceof NodeInterface || $node->isPublished()) {
        return;
      }
      // One that names the page by its address is not found by its number.
      $redirects = self::redirectsTo($node) + [$redirect->id() => $redirect];
      $older = 0;
      foreach ($redirects as $other) {
        $older += (int) ($other->id() !== $redirect->id());
        $other->delete();
      }
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
   * Form validation: refuses a target that is an unpublished page.
   *
   * The insert and update hooks would delete such a redirect right after the
   * form saved it; here the editor is told before anything is saved. An edit
   * that keeps the target is accepted, as the update hook keeps it.
   */
  public static function validateRedirectForm(array &$form, FormStateInterface $form_state): void {
    // The link widget has turned the typed target into a URI by now.
    $uri = (string) $form_state->getValue(['redirect_redirect', 0, 'uri'], '');
    $form_object = $form_state->getFormObject();
    $redirect = $form_object instanceof EntityFormInterface ? $form_object->getEntity() : NULL;
    if ($redirect instanceof Redirect && !$redirect->isNew() && ($redirect->getRedirect()['uri'] ?? '') === $uri) {
      return;
    }
    $node = self::targetNode($uri);
    if ($node instanceof NodeInterface && !$node->isPublished()) {
      $form_state->setErrorByName('redirect_redirect', new TranslatableMarkup(
        'This page is not published, and a redirect to it would show its address. Add the redirect after the page is published.',
      ));
    }
  }

  /**
   * The node a redirect target points at, read from storage, if any.
   *
   * Takes every form the target is stored in: internal:/node/N, entity:node/N
   * and the page's address, which the redirect form stores as typed, each
   * with a query string or a fragment. The address is resolved without an
   * access check, as the redirect is answered without one.
   */
  public static function targetNode(string $uri): ?NodeInterface {
    try {
      $url = Url::fromUri($uri);
    }
    catch (\InvalidArgumentException) {
      return NULL;
    }
    if (!$url->isRouted() || $url->getRouteName() !== 'entity.node.canonical') {
      return NULL;
    }
    $id = $url->getRouteParameters()['node'] ?? NULL;
    if (!is_numeric($id)) {
      return NULL;
    }
    $node = \Drupal::entityTypeManager()->getStorage('node')->loadUnchanged($id);
    return $node instanceof NodeInterface ? $node : NULL;
  }

  /**
   * Every redirect to a node, disabled ones and ones with a query included.
   *
   * A disabled redirect would forward to the page's current address once
   * enabled.
   *
   * @return \Drupal\redirect\Entity\Redirect[]
   *   The redirects.
   */
  private static function redirectsTo(NodeInterface $node): array {
    $storage = \Drupal::entityTypeManager()->getStorage('redirect');
    $query = $storage->getQuery()->accessCheck(FALSE);
    $targets = $query->orConditionGroup();
    foreach (['internal:/node/', 'entity:node/'] as $prefix) {
      $uri = $prefix . $node->id();
      $targets->condition('redirect_redirect.uri', $uri);
      $targets->condition('redirect_redirect.uri', "$uri?", 'STARTS_WITH');
      $targets->condition('redirect_redirect.uri', "$uri#", 'STARTS_WITH');
    }
    return $storage->loadMultiple($query->condition($targets)->execute());
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
