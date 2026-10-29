<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit;

use Drupal\Core\Config\ConfigManagerInterface;
use Drupal\Core\Config\StorageInterface;
use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\Update\UpdateHookRegistry;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Removes what would keep TMGMT from uninstalling cleanly.
 *
 * Runs in the update step of a deploy, before the configuration import that
 * uninstalls TMGMT.
 */
final class TmgmtCleanup implements ContainerInjectionInterface {

  private const MODULES = ['tmgmt', 'tmgmt_config', 'tmgmt_content', 'tmgmt_locale'];

  private const ENTITY_TYPE_IDS = ['tmgmt_job', 'tmgmt_job_item', 'tmgmt_message', 'tmgmt_remote'];

  private const DELETE_BATCH_SIZE = 50;

  private const REMOVED_MODULE = 'tmgmt_deepl';

  private const ENGLISH_OVERRIDE_COLLECTION = 'language.en';

  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly ModuleHandlerInterface $moduleHandler,
    private readonly UpdateHookRegistry $updateHookRegistry,
    private readonly ConfigManagerInterface $configManager,
    private readonly StorageInterface $configStorage,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('entity_type.manager'),
      $container->get('module_handler'),
      $container->get('update.update_hook_registry'),
      $container->get('config.manager'),
      $container->get('config.storage'),
    );
  }

  /**
   * Deletes the TMGMT translation jobs, one batch per call.
   *
   * Drupal refuses to uninstall a module while content entities of it exist.
   * The translations themselves are not TMGMT entities and stay. Jobs go
   * first: a job deletes its own items, messages and remote mappings, and an
   * item of a deleted job never asks for the job's translator, which no longer
   * exists. Whatever is left after that is deleted directly. Without TMGMT
   * this does nothing.
   */
  public function deleteJobs(array &$sandbox): string {
    $entityTypeIds = array_values(array_filter(self::ENTITY_TYPE_IDS, $this->entityTypeManager->hasDefinition(...)));
    if (!$entityTypeIds) {
      $sandbox['#finished'] = 1;
      return 'TMGMT is not installed, no translation jobs to delete.';
    }

    $sandbox['initial'] ??= array_combine($entityTypeIds, array_map($this->countEntities(...), $entityTypeIds));

    foreach ($entityTypeIds as $entityTypeId) {
      $storage = $this->entityTypeManager->getStorage($entityTypeId);
      $ids = $storage->getQuery()
        ->accessCheck(FALSE)
        ->sort($storage->getEntityType()->getKey('id'))
        ->range(0, self::DELETE_BATCH_SIZE)
        ->execute();
      if ($ids) {
        $entities = $storage->loadMultiple($ids);
        if (count($entities) !== count($ids)) {
          throw new \RuntimeException("Could not load all $entityTypeId entities to delete: " . implode(', ', array_diff($ids, array_keys($entities))));
        }
        $storage->delete($entities);
        $sandbox['#finished'] = 0;
        return "Deleting $entityTypeId entities.";
      }
    }

    $sandbox['#finished'] = 1;
    $summary = [];
    foreach ($sandbox['initial'] as $entityTypeId => $initial) {
      $summary[] = "$entityTypeId: $initial";
    }
    return 'Deleted TMGMT entities (' . implode(', ', $summary) . ').';
  }

  /**
   * Deletes the schema version that the removed module tmgmt_deepl left.
   *
   * Without it, every update run warns that tmgmt_deepl has an entry in
   * system.schema but is missing from the site.
   *
   * @see https://www.drupal.org/node/3137656
   */
  public function deleteDeeplSchemaVersion(): string {
    $module = self::REMOVED_MODULE;
    if ($this->moduleHandler->moduleExists($module)) {
      return "$module is installed, its schema version is kept.";
    }
    if ($this->updateHookRegistry->getInstalledVersion($module) === UpdateHookRegistry::SCHEMA_UNINSTALLED) {
      return "$module has no schema version.";
    }
    $this->updateHookRegistry->deleteInstalledVersion($module);
    return "Deleted the schema version of $module.";
  }

  /**
   * Deletes the English overrides of the config that the uninstall deletes.
   *
   * While English is the default language and not translatable, core gives
   * English overrides a NullStorage, so neither the uninstall nor a
   * configuration import can delete the rows that exist. Without this they
   * stay after TMGMT is gone, and config:status lists them after every
   * deploy. The configuration itself stays for the uninstall.
   *
   * @see \Drupal\language\Config\LanguageConfigFactoryOverride::getStorage()
   */
  public function deleteEnglishOverrides(): string {
    $modules = array_values(array_filter(self::MODULES, $this->moduleHandler->moduleExists(...)));
    if (!$modules) {
      return 'TMGMT is not installed, no English overrides to delete.';
    }
    $names = [];
    foreach ($modules as $module) {
      array_push($names, ...$this->configManager->getConfigFactory()->listAll("$module."));
    }
    foreach ($this->configManager->getConfigEntitiesToChangeOnDependencyRemoval('module', $modules)['delete'] as $entity) {
      $names[] = $entity->getConfigDependencyName();
    }

    $overrides = $this->configStorage->createCollection(self::ENGLISH_OVERRIDE_COLLECTION);
    $deleted = array_values(array_filter(array_unique($names), $overrides->exists(...)));
    sort($deleted);
    foreach ($deleted as $name) {
      $overrides->delete($name);
    }
    return $deleted
      ? 'Deleted the English overrides of: ' . implode(', ', $deleted) . '.'
      : 'No English overrides of TMGMT config.';
  }

  /**
   * Counts the entities of the given type, without access checks.
   */
  private function countEntities(string $entityTypeId): int {
    return (int) $this->entityTypeManager->getStorage($entityTypeId)
      ->getQuery()
      ->accessCheck(FALSE)
      ->count()
      ->execute();
  }

}
