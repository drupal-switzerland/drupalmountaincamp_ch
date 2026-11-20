<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit;

use Drupal\Core\Cache\Cache;
use Drupal\path_alias\PathAliasInterface;

/**
 * Keeps cached redirect answers in step with a page's current address.
 *
 * A redirect points at a page's internal path and is answered with the
 * page's alias at that moment. That cached answer is tagged with the
 * redirect only, so it has to be invalidated when the alias changes.
 */
final class RedirectFreshness {

  /**
   * Invalidates the redirects that lead to the page of a saved alias.
   */
  public static function aliasChanged(PathAliasInterface $alias): void {
    if (!\Drupal::hasService('redirect.repository')) {
      return;
    }
    $path = $alias->getPath();
    $redirects = \Drupal::service('redirect.repository')->findByDestinationUri([
      'internal:' . $path,
      'entity:' . ltrim($path, '/'),
    ]);
    $tags = [];
    foreach ($redirects as $redirect) {
      $tags = Cache::mergeTags($tags, $redirect->getCacheTagsToInvalidate());
    }
    if ($tags) {
      Cache::invalidateTags($tags);
    }
  }

}
