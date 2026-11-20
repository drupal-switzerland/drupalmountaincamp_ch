<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\blokkli_starterkit\RokkaFileMigration;
use Drupal\Core\File\FileSystemInterface;
use Drupal\file\Entity\File;
use Drupal\file\FileInterface;
use Drupal\KernelTests\KernelTestBase;
use Drupal\rokka\Entity\RokkaMetadata;
use GuzzleHttp\Client;
use GuzzleHttp\Handler\MockHandler;
use GuzzleHttp\HandlerStack;
use GuzzleHttp\Middleware;
use GuzzleHttp\Psr7\Response;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests moving rokka:// files to public://.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class RokkaFileMigrationTest extends KernelTestBase {

  private const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'blokkli_starterkit',
    'crop',
    'file',
    'image',
    'rokka',
    'system',
    'user',
  ];

  /**
   * Requests sent to the mocked CDN.
   *
   * @var array<int, array{request: \Psr\Http\Message\RequestInterface}>
   */
  private array $requests = [];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installEntitySchema('file');
    $this->installEntitySchema('rokka_metadata');
    $this->installSchema('file', ['file_usage']);
  }

  /**
   * A file is downloaded to public:// and keeps its fid.
   */
  public function testMovesFileAndKeepsFid(): void {
    $file = $this->createRokkaFile('rokka://media/icons/icon.svg', 'abc123');
    $this->mockCdn(new Response(200, ['Content-Type' => 'image/svg+xml; charset=utf-8'], self::SVG));

    $summary = $this->migrate();

    $this->assertSame('Moved 1 of 1 rokka files to public://.', $summary);
    $this->assertSame(RokkaFileMigration::CDN_HOST . '/dynamic/noop/abc123.svg', (string) $this->requests[0]['request']->getUri());
    $reloaded = $this->reload($file);
    $this->assertSame('public://media/icons/icon.svg', $reloaded->getFileUri());
    $this->assertSame('image/svg+xml', $reloaded->getMimeType());
    $this->assertSame(strlen(self::SVG), (int) $reloaded->getSize());
    $this->assertSame(self::SVG, file_get_contents('public://media/icons/icon.svg'));
  }

  /**
   * An existing public file is not overwritten.
   */
  public function testRenamesOnClash(): void {
    $file = $this->createRokkaFile('rokka://media/photo.jpg', 'def456');
    $directory = 'public://media';
    \Drupal::service('file_system')->prepareDirectory($directory, FileSystemInterface::CREATE_DIRECTORY);
    file_put_contents('public://media/photo.jpg', 'existing');
    $this->mockCdn(new Response(200, ['Content-Type' => 'image/jpeg'], 'jpeg-bytes'));

    $this->migrate();

    $this->assertSame('public://media/photo_0.jpg', $this->reload($file)->getFileUri());
    $this->assertSame('existing', file_get_contents('public://media/photo.jpg'));
  }

  /**
   * Failures leave the file entity untouched and are reported.
   *
   * @param \GuzzleHttp\Psr7\Response|null $response
   *   The CDN response, or NULL when no request is expected.
   * @param bool $withMetadata
   *   Whether a rokka_metadata row exists for the file.
   * @param string $reason
   *   The expected reason in the summary.
   */
  #[\PHPUnit\Framework\Attributes\DataProvider('failureProvider')]
  public function testFailureLeavesFileUntouched(?Response $response, bool $withMetadata, string $reason): void {
    $uri = 'rokka://media/icons/icon.svg';
    $file = $withMetadata ? $this->createRokkaFile($uri, 'abc123') : $this->createFile($uri);
    $this->mockCdn(...($response ? [$response] : []));
    $before = $this->reload($file)->toArray();

    $summary = $this->migrate();

    $this->assertSame("Moved 0 of 1 rokka files to public://. Failed: $uri ($reason)", $summary);
    $this->assertSame($before, $this->reload($file)->toArray());
    $this->assertFileDoesNotExist('public://media/icons/icon.svg');
  }

  /**
   * Data provider for testFailureLeavesFileUntouched().
   */
  public static function failureProvider(): array {
    return [
      '404' => [new Response(404), TRUE, 'CDN returned 404'],
      'wrong content type' => [
        new Response(200, ['Content-Type' => 'application/json'], '{}'),
        TRUE,
        "CDN returned 'application/json', expected 'image/svg+xml'",
      ],
      'missing metadata' => [NULL, FALSE, 'no rokka metadata'],
    ];
  }

  /**
   * Only rokka:// files are touched.
   */
  public function testIgnoresOtherSchemes(): void {
    $file = $this->createFile('public://other.svg');
    $this->mockCdn();

    $this->assertSame('Moved 0 of 0 rokka files to public://.', $this->migrate());
    $this->assertSame('public://other.svg', $this->reload($file)->getFileUri());
  }

  /**
   * Cron does nothing when no rokka files are left.
   */
  public function testCronSkipsWithoutRokkaFiles(): void {
    $this->mockCdn();

    blokkli_starterkit_cron();

    $this->assertSame([], $this->requests);
    $this->assertNull(\Drupal::state()->get(RokkaFileMigration::CRON_LAST_RUN_KEY));
  }

  /**
   * Cron retries rokka files once the last run is a day old.
   */
  public function testCronRetriesAfterOneDay(): void {
    $file = $this->createRokkaFile('rokka://media/icons/icon.svg', 'abc123');
    $now = \Drupal::time()->getRequestTime();
    \Drupal::state()->set(RokkaFileMigration::CRON_LAST_RUN_KEY, $now - 86400);
    $this->mockCdn(new Response(200, ['Content-Type' => 'image/svg+xml'], self::SVG));

    blokkli_starterkit_cron();

    $this->assertCount(1, $this->requests);
    $this->assertSame('public://media/icons/icon.svg', $this->reload($file)->getFileUri());
    $this->assertSame($now, \Drupal::state()->get(RokkaFileMigration::CRON_LAST_RUN_KEY));
  }

  /**
   * Cron skips rokka files within a day of the last run.
   */
  public function testCronSkipsWithinOneDay(): void {
    $file = $this->createRokkaFile('rokka://media/icons/icon.svg', 'abc123');
    $lastRun = \Drupal::time()->getRequestTime() - 3600;
    \Drupal::state()->set(RokkaFileMigration::CRON_LAST_RUN_KEY, $lastRun);
    $this->mockCdn();

    blokkli_starterkit_cron();

    $this->assertSame([], $this->requests);
    $this->assertSame('rokka://media/icons/icon.svg', $this->reload($file)->getFileUri());
    $this->assertSame($lastRun, \Drupal::state()->get(RokkaFileMigration::CRON_LAST_RUN_KEY));
  }

  /**
   * Creates a file entity.
   */
  private function createFile(string $uri): FileInterface {
    $file = File::create([
      'uri' => $uri,
      'filemime' => 'image/svg+xml',
      'filesize' => 10,
      'status' => 1,
    ]);
    $file->save();
    return $file;
  }

  /**
   * Creates a file entity with its rokka metadata.
   */
  private function createRokkaFile(string $uri, string $hash): FileInterface {
    RokkaMetadata::create(['uri' => $uri, 'hash' => $hash, 'binary_hash' => $hash])->save();
    return $this->createFile($uri);
  }

  /**
   * Replaces the HTTP client with one that returns the given responses.
   */
  private function mockCdn(Response ...$responses): void {
    $stack = HandlerStack::create(new MockHandler($responses));
    $stack->push(Middleware::history($this->requests));
    $this->container->set('http_client', new Client(['handler' => $stack]));
  }

  /**
   * Runs the migration.
   */
  private function migrate(): string {
    return \Drupal::classResolver(RokkaFileMigration::class)->moveAll();
  }

  /**
   * Reloads a file entity from storage.
   */
  private function reload(FileInterface $file): FileInterface {
    $storage = \Drupal::entityTypeManager()->getStorage('file');
    $storage->resetCache();
    $reloaded = $storage->load($file->id());
    $this->assertInstanceOf(FileInterface::class, $reloaded);
    $this->assertSame($file->id(), $reloaded->id());
    return $reloaded;
  }

}
