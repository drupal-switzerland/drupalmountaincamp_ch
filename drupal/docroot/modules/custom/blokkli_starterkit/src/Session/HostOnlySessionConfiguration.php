<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit\Session;

use Drupal\Core\Session\SessionConfiguration;
use Symfony\Component\HttpFoundation\Request;

/**
 * Issues the session cookie without a Domain attribute.
 *
 * Core sends "Domain=.host", which hands the cookie to every subdomain. A
 * cookie_domain set in session.storage.options is still honoured.
 */
class HostOnlySessionConfiguration extends SessionConfiguration {

  /**
   * Gives the host-only cookie its own name.
   *
   * Browsers send an older "Domain=.host" cookie of the same name first, and
   * PHP reads only the first, so a shared name would keep logins failing until
   * that cookie expires.
   */
  public const NAME_SUFFIX = ':host-only';

  /**
   * {@inheritdoc}
   */
  public function __construct($options = []) {
    $options['name_suffix'] = ($options['name_suffix'] ?? '') . self::NAME_SUFFIX;
    parent::__construct($options);
  }

  /**
   * {@inheritdoc}
   */
  protected function getCookieDomain(Request $request) {
    return isset($this->options['cookie_domain']) ? parent::getCookieDomain($request) : NULL;
  }

}
