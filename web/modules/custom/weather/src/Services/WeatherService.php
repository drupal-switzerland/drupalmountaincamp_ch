<?php

namespace Drupal\weather\Services;

/**
 * Class WeatherService.
 */
class WeatherService {

  /**
   * Constructs a new WeatherService object.
   */
  public function __construct() {}

  /**
   * Helper function to return the Weather API parameters.
   *
   * @return array
   *   The Weather API parameters.
   */
  private function get_url_params() {
    return [
      'base_url' => 'https://api.darksky.net/forecast',
      'latitude' => '46.8027',
      'longitude' => '9.8360',
      'key' => 'c1a191964665386e40dc14489ed6e886',
      'query' => [
        'exclude' => 'minutely,hourly,alerts,flags',
        'units' => 'si',
      ],
    ];
  }

  /**
   * Helper function to fetch the weather forecast data.
   *
   * @return array
   *   The response data in JSON format.
   */
  private function get_data(array $url) {
    try {
      $client = \Drupal::httpClient();
      $request = $client->get("{$url['base_url']}/{$url['key']}/{$url['latitude']},{$url['longitude']}" , ['query' => $url['query']]);
      return json_decode($request->getBody(), true);
    } catch (\Throwable $error) {

    }
  }

  /**
   * Helper function to sort the data.
   *
   * @return array
   *   The sorted requested data.
   */
  private function sort_data(array $data) {
    $days = array_slice($data['daily']['data'], 0, 5);
    $days[0]['temperature'] = $data['currently']['temperature'];
    return $days;
  }

  /**
   * Helper function to get cached data or make the request
   * to fetch the data and cache requested data.
   *
   * @return array
   *   The requested data.
   */
  public function get_weather_data() {
    $data = &drupal_static(__FUNCTION__);
    $cid = 'weather:forcast';
    $requestTime = \Drupal::time()->getRequestTime();
    if (($cache = \Drupal::cache()->get($cid)) && $cache->expire > $requestTime) {
      $data = $cache->data;
    } else {
      $url = $this->get_url_params();
      $requestedData = $this->get_data($url);
      if ($requestedData) {
        $data = $this->sort_data($requestedData);
        \Drupal::cache()->set($cid, $data, ($requestTime + 3600));
      }
    }
    return $data;
  }
}
