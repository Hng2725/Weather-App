import {
  currentWeatherFixture,
  forecastFixture,
} from '../test-fixtures/openWeather';
import {mapWeatherResponse} from '../src/services/weatherMapper';

describe('mapWeatherResponse', () => {
  test('maps free current and 3-hour forecast responses without inventing UV data', () => {
    const result = mapWeatherResponse(
      currentWeatherFixture,
      forecastFixture,
      'Quận 1, Việt Nam',
    );

    expect(result).not.toBeNull();
    expect(result?.locationName).toBe('Quận 1, Việt Nam');
    expect(result?.timezoneOffset).toBe(25200);
    expect(result?.current).toMatchObject({
      temperature: 29.6,
      high: 31,
      low: 24,
      rainVolume: 1.2,
    });
    expect(result?.current.uvIndex).toBeUndefined();
    expect(result?.hourly).toHaveLength(8);
    expect(result?.hourly[0]).toMatchObject({
      temperature: 24,
      rainProbability: 0.1,
      rainVolume: 0.4,
      description: 'mưa nhẹ',
    });
    expect(result?.hourly[0].uvIndex).toBeUndefined();
    expect(result?.daily).toHaveLength(5);
    expect(result?.daily[0]).toMatchObject({
      high: 31,
      low: 24,
      feelsLike: 29,
      rainProbability: 0.8,
      rainVolume: 3.2,
      description: 'mưa vừa',
    });
    expect(result?.daily[0].uvIndex).toBeUndefined();
  });

  test('returns null when a required free API response is malformed', () => {
    expect(mapWeatherResponse(null, forecastFixture, 'Huế')).toBeNull();
    expect(
      mapWeatherResponse(currentWeatherFixture, null, 'Huế'),
    ).toBeNull();
    expect(
      mapWeatherResponse(
        currentWeatherFixture,
        {...forecastFixture, list: forecastFixture.list.slice(0, 7)},
        'Huế',
      ),
    ).toBeNull();
  });
});
