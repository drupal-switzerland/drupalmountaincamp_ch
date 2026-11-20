<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit;

/**
 * Frontend pages without a Drupal route that belong in the sitemap.
 */
final class SitemapLinks {

  /**
   * The sitemap that lists the site's content.
   */
  public const CONTENT_SITEMAP = 'default';

  /**
   * The news overview, the parent path of the press release aliases.
   */
  public const NEWS_OVERVIEW_PATH = '/news';

}
