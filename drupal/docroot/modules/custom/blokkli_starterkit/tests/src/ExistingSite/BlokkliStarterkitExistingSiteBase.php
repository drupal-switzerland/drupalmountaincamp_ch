<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\ExistingSite;

use Drupal\Tests\blokkli_starterkit\Traits\ContentCreationTrait;
use weitzman\DrupalTestTraits\ExistingSiteBase;

/**
 * Base class for existing site tests for the Blokkli Starterkit.
 */
abstract class BlokkliStarterkitExistingSiteBase extends ExistingSiteBase {

  use ContentCreationTrait;

}
