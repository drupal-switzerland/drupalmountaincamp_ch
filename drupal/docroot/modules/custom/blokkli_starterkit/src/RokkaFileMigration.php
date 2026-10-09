<?php

declare(strict_types=1);

namespace Drupal\blokkli_starterkit;

use Drupal\Component\Datetime\TimeInterface;
use Drupal\Core\DependencyInjection\ContainerInjectionInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\File\FileExists;
use Drupal\Core\File\FileSystemInterface;
use Drupal\Core\State\StateInterface;
use Drupal\file\FileInterface;
use Drupal\rokka\Entity\RokkaMetadataInterface;
use GuzzleHttp\ClientInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Mime\MimeTypeGuesserInterface;

/**
 * Moves rokka:// files to public:// using rokka's public CDN.
 *
 * The site has no rokka API key, so rokka:// files can't be read through the
 * stream wrapper. The CDN serves them without one. Each file entity keeps its
 * fid, so media references and file usage stay intact.
 */
final class RokkaFileMigration implements ContainerInjectionInterface {

  public const CDN_HOST = 'https://mountaincamp.rokka.io';

  public const CRON_LAST_RUN_KEY = 'blokkli_starterkit.rokka_migration_last_run';

  private const TIMEOUT_SECONDS = 30;

  private const CRON_INTERVAL_SECONDS = 86400;

  public function __construct(
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly ClientInterface $httpClient,
    private readonly FileSystemInterface $fileSystem,
    private readonly MimeTypeGuesserInterface $mimeTypeGuesser,
    private readonly LoggerInterface $logger,
    private readonly StateInterface $state,
    private readonly TimeInterface $time,
  ) {}

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container): self {
    return new self(
      $container->get('entity_type.manager'),
      $container->get('http_client'),
      $container->get('file_system'),
      $container->get('file.mime_type.guesser'),
      $container->get('logger.factory')->get('blokkli_starterkit'),
      $container->get('state'),
      $container->get('datetime.time'),
    );
  }

  /**
   * Retries files the deploy couldn't move, at most once a day.
   */
  public function retryOnCron(): void {
    if (!$this->findRokkaFileIds()) {
      return;
    }
    $now = $this->time->getRequestTime();
    $lastRun = (int) $this->state->get(self::CRON_LAST_RUN_KEY, 0);
    if ($now - $lastRun < self::CRON_INTERVAL_SECONDS) {
      return;
    }
    $this->state->set(self::CRON_LAST_RUN_KEY, $now);
    $this->moveAll();
  }

  /**
   * Moves every rokka:// file; a failed file is logged and left as it is.
   *
   * @return string
   *   A summary of moved and failed files.
   */
  public function moveAll(): string {
    $fids = $this->findRokkaFileIds();

    $failed = [];
    foreach ($this->entityTypeManager->getStorage('file')->loadMultiple($fids) as $file) {
      assert($file instanceof FileInterface);
      $error = $this->move($file);
      if ($error !== NULL) {
        $failed[] = $file->getFileUri() . " ($error)";
        $this->logger->critical('Could not move @uri to public://: @error', [
          '@uri' => $file->getFileUri(),
          '@error' => $error,
        ]);
      }
    }

    $total = count($fids);
    $summary = sprintf('Moved %d of %d rokka files to public://.', $total - count($failed), $total);
    return $failed ? $summary . ' Failed: ' . implode('; ', $failed) : $summary;
  }

  /**
   * Returns the IDs of files still stored on rokka://.
   *
   * @return int[]|string[]
   *   The file IDs.
   */
  private function findRokkaFileIds(): array {
    return $this->entityTypeManager->getStorage('file')->getQuery()
      ->accessCheck(FALSE)
      ->condition('uri', 'rokka://', 'STARTS_WITH')
      ->execute();
  }

  /**
   * Moves one file.
   *
   * @return string|null
   *   The reason it failed, or NULL on success.
   */
  private function move(FileInterface $file): ?string {
    $rokkaUri = $file->getFileUri();
    $metadata = $this->entityTypeManager->getStorage('rokka_metadata')->loadByProperties(['uri' => $rokkaUri]);
    $metadata = reset($metadata);
    $hash = $metadata instanceof RokkaMetadataInterface ? $metadata->getHash() : NULL;
    if (!$hash) {
      return 'no rokka metadata';
    }

    $target = 'public://' . substr($rokkaUri, strlen('rokka://'));
    $extension = strtolower(pathinfo($rokkaUri, PATHINFO_EXTENSION));
    $expectedMime = $this->mimeTypeGuesser->guessMimeType($target);
    if ($extension === '' || !$expectedMime || !str_starts_with($expectedMime, 'image/')) {
      return "unsupported file type '$extension'";
    }

    try {
      $response = $this->httpClient->request('GET', self::CDN_HOST . "/dynamic/noop/$hash.$extension", [
        'timeout' => self::TIMEOUT_SECONDS,
        'http_errors' => FALSE,
      ]);
    }
    catch (\Throwable $e) {
      return 'download failed: ' . $e->getMessage();
    }

    if ($response->getStatusCode() !== 200) {
      return 'CDN returned ' . $response->getStatusCode();
    }
    $mime = strtolower(trim(explode(';', $response->getHeaderLine('Content-Type'))[0]));
    if ($mime !== $expectedMime) {
      return "CDN returned '$mime', expected '$expectedMime'";
    }
    $data = (string) $response->getBody();
    if ($data === '') {
      return 'CDN returned an empty body';
    }

    try {
      $directory = $this->fileSystem->dirname($target);
      $this->fileSystem->prepareDirectory($directory, FileSystemInterface::CREATE_DIRECTORY | FileSystemInterface::MODIFY_PERMISSIONS);
      $publicUri = $this->fileSystem->saveData($data, $target, FileExists::Rename);
    }
    catch (\Throwable $e) {
      return 'write failed: ' . $e->getMessage();
    }

    try {
      $file->setFileUri($publicUri);
      $file->setMimeType($mime);
      $file->setSize(strlen($data));
      $file->save();
    }
    catch (\Throwable $e) {
      $this->fileSystem->delete($publicUri);
      return 'saving the file entity failed: ' . $e->getMessage();
    }
    return NULL;
  }

}
