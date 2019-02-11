<?php

namespace Drupal\weather\Plugin\Block;

use Drupal\Core\Block\BlockBase;

/**
 * Provides a 'Weather' Block.
 *
 * @Block(
 *   id = "weather_block",
 *   admin_label = @Translation("Weather Block"),
 *   category = @Translation("Custom"),
 * )
 */
class WeatherBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build() {
    return [
      '#theme' => 'weather_block',
      '#weather_data' =>  \Drupal::service('weather.weather_services')->get_weather_data()
    ];
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheMaxAge() {
    return 0;
  }
}
