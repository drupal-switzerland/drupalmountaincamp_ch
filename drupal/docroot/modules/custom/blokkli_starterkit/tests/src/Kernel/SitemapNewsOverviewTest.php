<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\simple_sitemap\Entity\SimpleSitemap;
use Drupal\simple_sitemap\Queue\QueueWorker;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

/**
 * Tests that the sitemap lists the frontend's news overview.
 */
#[Group('blokkli_starterkit')]
#[RunTestsInSeparateProcesses]
class SitemapNewsOverviewTest extends KernelTestBase {

  private const PUBLIC_URL = 'https://public.example';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'blokkli_starterkit',
    'simple_sitemap',
    'system',
    'user',
  ];

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->installEntitySchema('user');
    $this->installSchema('simple_sitemap', ['simple_sitemap']);
    $this->installConfig(['system', 'simple_sitemap']);
    $this->config('simple_sitemap.settings')->set('base_url', self::PUBLIC_URL)->save();
  }

  /**
   * The generated content sitemap has /news on the configured public domain.
   */
  public function testContentSitemapListsNewsOverview(): void {
    $this->container->get('simple_sitemap.generator')
      ->generate(QueueWorker::GENERATE_TYPE_BACKEND);

    $xml = SimpleSitemap::load('default')->toString();

    $this->assertStringContainsString('<loc>' . self::PUBLIC_URL . '/news</loc>', $xml);
  }

  /**
   * Other sitemaps, such as the index, get no news link.
   */
  public function testOtherSitemapsGetNoNewsLink(): void {
    $links = [];
    $index = SimpleSitemap::create(['id' => 'index', 'type' => 'index']);

    $this->container->get('module_handler')
      ->alter('simple_sitemap_arbitrary_links', $links, $index);

    $this->assertSame([], $links);
  }

}
