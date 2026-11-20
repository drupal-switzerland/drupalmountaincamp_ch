<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Unit;

use Drupal\Core\DependencyInjection\ContainerBuilder;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Form\FormState;
use Drupal\Core\Theme\ActiveTheme;
use Drupal\Core\Theme\ThemeManagerInterface;
use Drupal\Tests\UnitTestCase;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the text format help and admin theme hooks of blokkli_starterkit.
 */
#[Group('blokkli_starterkit')]
class FormAndPageHooksTest extends UnitTestCase {

  private const AFTER_BUILD = '_blokkli_starterkit_remove_textarea_help';

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    require_once $this->root . '/modules/contrib/allowed_formats/allowed_formats.module';
    require_once $this->root . '/modules/custom/blokkli_starterkit/blokkli_starterkit.module';
  }

  /**
   * Runs the widget alter hook for a field of the given type.
   */
  private function alterWidget(string $fieldType, bool $isDefaultValueWidget = FALSE): array {
    $definition = $this->createMock(FieldDefinitionInterface::class);
    $definition->method('getType')->willReturn($fieldType);
    $items = $this->createMock(FieldItemListInterface::class);
    $items->method('getFieldDefinition')->willReturn($definition);
    $formState = new FormState();
    if ($isDefaultValueWidget) {
      $formState->set('default_value_widget', TRUE);
    }

    $element = [];
    blokkli_starterkit_field_widget_single_element_form_alter($element, $formState, ['items' => $items]);
    return $element;
  }

  /**
   * Formatted text widgets get the callback that removes the format help.
   */
  #[DataProvider('formattedTextTypes')]
  public function testFormattedTextWidgetsLoseTheFormatHelp(string $fieldType): void {
    $this->assertSame([self::AFTER_BUILD], $this->alterWidget($fieldType)['#after_build']);
  }

  /**
   * Field types with a text format.
   */
  public static function formattedTextTypes(): array {
    return [['text'], ['text_long'], ['text_with_summary']];
  }

  /**
   * Other widgets, and the default value form of a field, are left alone.
   */
  public function testOtherWidgetsAreLeftAlone(): void {
    $this->assertSame([], $this->alterWidget('string'));
    $this->assertSame([], $this->alterWidget('entity_reference'));
    $this->assertSame([], $this->alterWidget('text_long', TRUE));
  }

  /**
   * The help link and guidelines go, the format selector stays.
   */
  public function testRemovesHelpAndGuidelines(): void {
    $element = _blokkli_starterkit_remove_textarea_help([
      '#allowed_formats' => ['basic_html', 'full_html'],
      'format' => [
        '#type' => 'container',
        '#theme_wrappers' => ['container'],
        'help' => ['#markup' => 'About text formats'],
        'guidelines' => ['#markup' => 'Allowed tags'],
        'format' => ['#type' => 'select'],
      ],
    ], new FormState());

    $this->assertSame([
      '#type' => 'container',
      '#theme_wrappers' => ['container'],
      'format' => ['#type' => 'select'],
    ], $element['format']);
  }

  /**
   * With one allowed format there is nothing to choose: no wrapper either.
   */
  public function testSingleFormatAlsoLosesTheWrapper(): void {
    $element = _blokkli_starterkit_remove_textarea_help([
      '#allowed_formats' => ['basic_html'],
      'format' => [
        '#type' => 'container',
        '#theme_wrappers' => ['container'],
        'help' => ['#markup' => 'About text formats'],
        'guidelines' => ['#markup' => 'Allowed tags'],
        'format' => ['#type' => 'select'],
      ],
    ], new FormState());

    $this->assertSame(['format' => ['#type' => 'select']], $element['format']);
  }

  /**
   * An element without a format part comes back unchanged.
   */
  public function testElementWithoutFormatIsUnchanged(): void {
    $element = ['#type' => 'textfield', '#allowed_formats' => ['basic_html']];

    $this->assertSame($element, _blokkli_starterkit_remove_textarea_help($element, new FormState()));
  }

  /**
   * Returns the page attachments for the given active theme.
   */
  private function attachmentsForTheme(string $theme): array {
    $themeManager = $this->createMock(ThemeManagerInterface::class);
    $themeManager->method('getActiveTheme')->willReturn(new ActiveTheme(['name' => $theme]));
    $container = new ContainerBuilder();
    $container->set('theme.manager', $themeManager);
    \Drupal::setContainer($container);

    $attachments = ['#attached' => ['library' => ['core/drupal']]];
    blokkli_starterkit_page_attachments($attachments);
    return $attachments['#attached']['library'];
  }

  /**
   * The admin tweaks load in Gin only and keep the libraries already there.
   */
  public function testTweaksLibraryIsAttachedInGinOnly(): void {
    $this->assertSame(['core/drupal', 'blokkli_starterkit/tweaks'], $this->attachmentsForTheme('gin'));
    $this->assertSame(['core/drupal'], $this->attachmentsForTheme('claro'));
    $this->assertSame(['core/drupal'], $this->attachmentsForTheme('stark'));
  }

}
