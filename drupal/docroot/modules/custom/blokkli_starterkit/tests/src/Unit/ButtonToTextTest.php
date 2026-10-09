<?php

declare(strict_types=1);

namespace Drupal\Tests\blokkli_starterkit\Unit;

use Drupal\blokkli_starterkit\Plugin\ParagraphsBlokkli\Conversion\ButtonToText;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\GeneratedUrl;
use Drupal\Core\Url;
use Drupal\link\LinkItemInterface;
use Drupal\paragraphs\ParagraphInterface;
use Drupal\paragraphs_blokkli\ParagraphMutationContextInterface;
use Drupal\Tests\UnitTestCase;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;
use Symfony\Component\Routing\Exception\RouteNotFoundException;

/**
 * Tests the button to text paragraph conversion.
 */
#[CoversClass(ButtonToText::class)]
#[Group('blokkli_starterkit')]
class ButtonToTextTest extends UnitTestCase {

  /**
   * Converts a button with the given label and link (NULL: no link).
   */
  private function convert(string $label, ?string $generatedUrl, ?\Throwable $urlError = NULL): array {
    $labelField = $this->createMock(FieldItemListInterface::class);
    $labelField->method('__get')->with('value')->willReturn($label);

    $linkItem = NULL;
    if ($generatedUrl !== NULL || $urlError !== NULL) {
      $url = $this->createMock(Url::class);
      if ($urlError !== NULL) {
        $url->method('toString')->willThrowException($urlError);
      }
      else {
        $url->method('toString')->with(TRUE)
          ->willReturn((new GeneratedUrl())->setGeneratedUrl($generatedUrl));
      }
      $linkItem = $this->createMock(LinkItemInterface::class);
      $linkItem->method('isEmpty')->willReturn(FALSE);
      $linkItem->method('getUrl')->willReturn($url);
    }
    $linkField = $this->createMock(FieldItemListInterface::class);
    $linkField->method('first')->willReturn($linkItem);

    $paragraph = $this->createMock(ParagraphInterface::class);
    $paragraph->method('get')->willReturnMap([
      ['field_label', $labelField],
      ['field_link', $linkField],
    ]);

    $plugin = new ButtonToText([], 'button_to_text', []);
    $result = $plugin->convert(
      $paragraph,
      $this->createMock(ParagraphMutationContextInterface::class),
    );
    $this->assertIsArray($result);
    return $result;
  }

  /**
   * The text goes into the text paragraph's field in basic_html.
   */
  public function testTargetField(): void {
    $result = $this->convert('Tickets', '/tickets');
    $this->assertSame(['field_text'], array_keys($result));
    $this->assertSame('basic_html', $result['field_text']['format']);
  }

  /**
   * Internal links use the generated path (alias), not node/N.
   */
  public function testInternalLink(): void {
    $result = $this->convert('Plan your stay', '/davos');
    $this->assertSame(
      '<p><a href="/davos">Plan your stay</a></p>',
      $result['field_text']['value'],
    );
  }

  /**
   * Label and URL can't break out of the markup.
   */
  public function testEscaping(): void {
    $result = $this->convert('Say "hi" <b>now</b>', 'https://example.com/?a=1&b="x"');
    $this->assertSame(
      '<p><a href="https://example.com/?a=1&amp;b=&quot;x&quot;">Say &quot;hi&quot; &lt;b&gt;now&lt;/b&gt;</a></p>',
      $result['field_text']['value'],
    );
  }

  /**
   * Dangerous protocols are removed from the link.
   */
  public function testDangerousProtocol(): void {
    $result = $this->convert('Click', 'javascript:alert(1)');
    $this->assertStringNotContainsString('javascript:', $result['field_text']['value']);
  }

  /**
   * Without a label the URL becomes the link text.
   */
  public function testEmptyLabel(): void {
    $result = $this->convert('', 'https://example.com/');
    $this->assertSame(
      '<p><a href="https://example.com/">https://example.com/</a></p>',
      $result['field_text']['value'],
    );
  }

  /**
   * A link Drupal can't generate a URL for leaves the label as text.
   */
  public function testUngeneratableLink(): void {
    $result = $this->convert('Click', NULL, new \InvalidArgumentException('Invalid URI'));
    $this->assertSame('<p>Click</p>', $result['field_text']['value']);
  }

  /**
   * A removed route or missing route parameter leaves the label as text.
   */
  public function testRoutingError(): void {
    $result = $this->convert('Old', NULL, new RouteNotFoundException('Route "foo" does not exist.'));
    $this->assertSame('<p>Old</p>', $result['field_text']['value']);
  }

  /**
   * A target without a URL (<nolink>, <button>) leaves the label as text.
   */
  public function testTargetWithoutUrl(): void {
    $result = $this->convert('No link', '');
    $this->assertSame('<p>No link</p>', $result['field_text']['value']);
  }

  /**
   * Without a link the label is kept as plain text.
   */
  public function testWithoutLink(): void {
    $result = $this->convert('Just a <label>', NULL);
    $this->assertSame('<p>Just a &lt;label&gt;</p>', $result['field_text']['value']);
  }

}
