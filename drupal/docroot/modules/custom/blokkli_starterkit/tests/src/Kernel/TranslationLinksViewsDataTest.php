<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\KernelTests\KernelTestBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that the Translations views field is offered on the content views.
 *
 * The content overview uses it. Drupal 12 no longer loads hooks from a
 * .views.inc file, so the hook has to live where core still finds it.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class TranslationLinksViewsDataTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'blokkli_starterkit',
    'field',
    'node',
    'system',
    'text',
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
  }

  /**
   * The field is in the views data, without a deprecated hook file.
   */
  public function testTranslationLinksFieldIsInViewsData(): void {
    $this->container->get('module_handler')->resetImplementations();
    $views_data = $this->container->get('views.views_data');
    $views_data->clear();

    $deprecations = [];
    set_error_handler(function (int $level, string $message) use (&$deprecations): bool {
      if (str_contains($message, 'blokkli_starterkit')) {
        $deprecations[] = $message;
      }
      return TRUE;
    }, E_USER_DEPRECATED);
    try {
      $data = $views_data->getAll();
    }
    finally {
      restore_error_handler();
    }

    $this->assertSame([], $deprecations);
    $this->assertSame('translation_links_field', $data['node']['translation_links_field']['field']['id']);
  }

}
