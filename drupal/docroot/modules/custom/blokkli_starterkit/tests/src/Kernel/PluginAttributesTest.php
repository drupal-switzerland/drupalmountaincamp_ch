<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\blokkli_starterkit\Plugin\ParagraphsBlokkli\Mutation\AddTeaserFromNodeId;
use Drupal\blokkli_starterkit\Plugin\views\field\TranslationLinksViewsField;
use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that this module's plugins are discovered from PHP attributes.
 *
 * Plugin annotations are removed in Drupal 13.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class PluginAttributesTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'blokkli_starterkit',
    'crop',
    'entity_reference_revisions',
    'field',
    'file',
    'filter',
    'image',
    'media',
    'node',
    'paragraphs',
    'paragraphs_blokkli',
    'rokka',
    'system',
    'text',
    'user',
    'views',
  ];

  /**
   * The views field and the mutation keep their definitions.
   */
  public function testPluginsAreDiscoveredWithoutAnnotations(): void {
    $deprecations = [];
    set_error_handler(function (int $level, string $message) use (&$deprecations): bool {
      if (str_contains($message, 'translation_links_field') || str_contains($message, 'add_teaser_from_node_id')) {
        $deprecations[] = $message;
      }
      return TRUE;
    }, E_USER_DEPRECATED);
    try {
      $views_field = $this->definitionOf('plugin.manager.views.field', 'translation_links_field');
      $mutation = $this->definitionOf('plugin.manager.paragraph_mutation', 'add_teaser_from_node_id');
    }
    finally {
      restore_error_handler();
    }

    $this->assertSame([], $deprecations);
    $this->assertSame(TranslationLinksViewsField::class, $views_field['class']);
    $this->assertSame(AddTeaserFromNodeId::class, $mutation['class']);
    $this->assertSame('Add teaser paragraph from a node ID.', (string) $mutation['label']);
    $this->assertSame(['nid', 'hostType', 'hostUuid', 'hostFieldName', 'afterUuid'], array_keys($mutation['arguments']));
    $this->assertFalse($mutation['arguments']['afterUuid']->isRequired());
    $this->assertTrue($mutation['arguments']['nid']->isRequired());
  }

  /**
   * A plugin definition, discovered afresh.
   *
   * @return array<string, mixed>
   *   The definition.
   */
  private function definitionOf(string $manager_id, string $plugin_id): array {
    $manager = $this->container->get($manager_id);
    $manager->clearCachedDefinitions();
    return $manager->getDefinition($plugin_id);
  }

}
