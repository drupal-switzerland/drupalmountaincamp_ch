<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Traits;

use Drupal\node\Entity\Node;
use weitzman\DrupalTestTraits\ExistingSiteBase;

/**
 * Reusable methods for creating content in existing site tests.
 */
trait ContentCreationTrait {

  /**
   * Creates content (and flags for clean-up after test run).
   *
   * @param array $values
   *   (optional) An array of field values.
   *
   * @return \Drupal\node\Entity\Node
   *   The saved block content entity.
   */
  protected function createContent(array $values = []): Node {
    assert($this instanceof ExistingSiteBase);
    $node = Node::create($values);
    $node->save();
    $this->markEntityForCleanup($node);
    return $node;
  }

}
