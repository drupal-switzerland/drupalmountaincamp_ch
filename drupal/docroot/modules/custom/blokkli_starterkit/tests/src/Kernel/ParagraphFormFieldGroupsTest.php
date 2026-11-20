<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\Core\Entity\Entity\EntityFormDisplay;
use Drupal\Core\Form\FormInterface;
use Drupal\Core\Form\FormState;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\field_group\FormatterHelper;
use Drupal\KernelTests\KernelTestBase;
use Drupal\paragraphs\Entity\Paragraph;
use Drupal\paragraphs\Entity\ParagraphsType;
use Drupal\paragraphs_blokkli\Form\ParagraphsBlokkliFormBase;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that blökkli paragraph forms get the field groups of the form display.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class ParagraphFormFieldGroupsTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'blokkli_starterkit',
    'crop',
    'entity_reference_revisions',
    'field',
    'field_group',
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
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installEntitySchema('paragraph');

    foreach (['text', 'teaser'] as $bundle) {
      ParagraphsType::create(['id' => $bundle, 'label' => $bundle])->save();
    }
    FieldStorageConfig::create([
      'field_name' => 'field_title',
      'entity_type' => 'paragraph',
      'type' => 'string',
    ])->save();
    FieldConfig::create([
      'field_name' => 'field_title',
      'entity_type' => 'paragraph',
      'bundle' => 'text',
    ])->save();

    EntityFormDisplay::create([
      'targetEntityType' => 'paragraph',
      'bundle' => 'text',
      'mode' => 'default',
      'status' => TRUE,
    ])
      ->setComponent('field_title', ['type' => 'string_textfield'])
      ->setThirdPartySetting('field_group', 'group_content', [
        'children' => ['field_title'],
        'label' => 'Content',
        'parent_name' => '',
        'region' => 'content',
        'weight' => 0,
        'format_type' => 'details',
        'format_settings' => [],
      ])
      ->save();
  }

  /**
   * Runs the form alter hook for a blökkli form of a paragraph of the bundle.
   */
  private function alterBlokkliForm(string $bundle): array {
    $formObject = $this->createMock(ParagraphsBlokkliFormBase::class);
    $formObject->method('getParagraph')->willReturn(Paragraph::create(['type' => $bundle]));

    $form = [];
    blokkli_starterkit_form_alter($form, (new FormState())->setFormObject($formObject));
    return $form;
  }

  /**
   * The groups of the paragraph's form display are attached and processed.
   */
  public function testBlokkliFormGetsTheFieldGroups(): void {
    $form = $this->alterBlokkliForm('text');

    $this->assertSame(['group_content'], array_keys($form['#fieldgroups']));
    $this->assertSame('Content', $form['#fieldgroups']['group_content']->label);
    $this->assertSame(['field_title' => 'group_content'], $form['#group_children']);
    $this->assertSame('paragraph', $form['#entity_type']);
    $this->assertContains([FormatterHelper::class, 'formProcess'], $form['#process']);
  }

  /**
   * A paragraph type without groups gets none of another type's groups.
   */
  public function testGroupsBelongToTheParagraphType(): void {
    $form = $this->alterBlokkliForm('teaser');

    $this->assertSame([], $form['#fieldgroups']);
    $this->assertSame([], $form['#group_children']);
  }

  /**
   * Forms that are not blökkli paragraph forms are left alone.
   */
  public function testOtherFormsAreLeftAlone(): void {
    $form = ['#process' => ['existing']];
    $formState = (new FormState())->setFormObject($this->createMock(FormInterface::class));
    blokkli_starterkit_form_alter($form, $formState);

    $this->assertSame(['#process' => ['existing']], $form);
  }

  /**
   * Without the field_group module the form is left alone.
   */
  public function testNothingIsAttachedWithoutFieldGroup(): void {
    $this->disableModules(['field_group']);

    $this->assertSame([], $this->alterBlokkliForm('text'));
  }

}
