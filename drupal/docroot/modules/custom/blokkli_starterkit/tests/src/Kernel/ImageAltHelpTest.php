<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\blokkli_starterkit\ImageAltHelp;
use Drupal\Core\Form\FormState;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\file\Entity\File;
use Drupal\KernelTests\KernelTestBase;
use Drupal\media\Entity\Media;
use Drupal\media_library\Form\FileUploadForm;
use Drupal\media_library\MediaLibraryState;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\Tests\media\Traits\MediaTypeCreationTrait;
use Drupal\Tests\user\Traits\UserCreationTrait;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests the help text under the alternative text input of image media.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class ImageAltHelpTest extends KernelTestBase {

  use MediaTypeCreationTrait;
  use UserCreationTrait;

  private const CORE_HELP_START = 'Short description of the image';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'allowed_formats',
    'blokkli_starterkit',
    'crop',
    'field',
    'file',
    'filter',
    'image',
    'media',
    'media_library',
    'node',
    'rokka',
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
    $this->installEntitySchema('file');
    $this->installEntitySchema('media');
    $this->installSchema('file', ['file_usage']);
    $this->installConfig(['system', 'field', 'filter', 'image', 'media', 'media_library']);
    $this->setUpCurrentUser([], [], TRUE);

    $this->createMediaType('image', ['id' => 'image']);
  }

  /**
   * The media form shows our help under the alternative text input.
   */
  public function testMediaFormShowsTheHelp(): void {
    $form = $this->container->get('entity.form_builder')
      ->getForm(Media::create(['bundle' => 'image']), 'add');

    $alt = $form['field_media_image']['widget'][0]['alt'];
    $this->assertSame((string) ImageAltHelp::description(), (string) $alt['#description']);
  }

  /**
   * The media library's upload form, used by every image field, shows it too.
   */
  public function testMediaLibraryUploadFormShowsTheHelp(): void {
    $file = File::create(['uri' => 'public://picture.png']);
    $file->save();
    $media = Media::create(['bundle' => 'image', 'field_media_image' => $file->id()]);
    $form_state = new FormState();
    $form_state->set('media_library_state', MediaLibraryState::create('media_library.opener.field_widget', ['image'], 'image', 1));
    $form_state->set('media', [$media]);

    $form = $this->container->get('form_builder')->buildForm(FileUploadForm::class, $form_state);

    $source_field = $form['media'][0]['fields']['field_media_image']['widget'][0];
    $this->assertSame('none', $source_field['#description_display']);
    $this->assertSame((string) ImageAltHelp::description(), (string) $source_field['alt']['#description']);
  }

  /**
   * Image fields elsewhere keep core's help text.
   */
  public function testOtherImageFieldsKeepCoreHelp(): void {
    NodeType::create(['type' => 'page', 'name' => 'Page'])->save();
    FieldStorageConfig::create(['field_name' => 'field_picture', 'entity_type' => 'node', 'type' => 'image'])->save();
    FieldConfig::create(['field_name' => 'field_picture', 'entity_type' => 'node', 'bundle' => 'page'])->save();
    $this->container->get('entity_display.repository')
      ->getFormDisplay('node', 'page')
      ->setComponent('field_picture', ['type' => 'image_image'])
      ->save();

    $form = $this->container->get('entity.form_builder')
      ->getForm(Node::create(['type' => 'page']));

    $alt = $form['field_picture']['widget'][0]['alt'];
    $this->assertStringStartsWith(self::CORE_HELP_START, (string) $alt['#description']);
  }

}
