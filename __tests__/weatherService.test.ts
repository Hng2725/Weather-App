import {
  currentWeatherFixture,
  forecastFixture,
} from '../test-fixtures/openWeather';
import {
  fetchWeather,
  WeatherServiceError,
} from '../src/services/weatherService';

const response = (body: unknown, ok = true, status = 200): Response =>
  ({
    ok,
    status,
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Response);

describe('fetchWeather', () => {
  test.each(['', 'YOUR_OPENWEATHER_API_KEY'])(
    'rejects an invalid API key: %s',
    async apiKey => {
      await expect(fetchWeather(10.77, 106.7, apiKey)).rejects.toMatchObject({
        code: 'config-error',
      });
    },
  );

  test('loads the free current, 5-day forecast and reverse-geocoding endpoints', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(response(currentWeatherFixture))
      .mockResolvedValueOnce(response(forecastFixture))
      .mockResolvedValueOnce(
        response([
          {
            name: 'District 1',
            local_names: {vi: 'Quận 1'},
            state: 'Thành phố Hồ Chí Minh',
            country: 'VN',
          },
        ]),
      );

    const result = await fetchWeather(
      10.77,
      106.7,
      'student-key',
      fetcher as typeof fetch,
    );

    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(fetcher.mock.calls[0][0]).toContain(
      'https://api.openweathermap.org/data/2.5/weather?',
    );
    expect(fetcher.mock.calls[1][0]).toContain(
      'https://api.openweathermap.org/data/2.5/forecast?',
    );
    expect(fetcher.mock.calls[2][0]).toContain(
      'https://api.openweathermap.org/geo/1.0/reverse?',
    );
    for (const [url] of fetcher.mock.calls) {
      expect(url).toContain('lat=10.77');
      expect(url).toContain('lon=106.7');
      expect(url).toContain('appid=student-key');
    }
    expect(fetcher.mock.calls[0][0]).toContain('units=metric');
    expect(fetcher.mock.calls[0][0]).toContain('lang=vi');
    expect(fetcher.mock.calls[1][0]).toContain('units=metric');
    expect(fetcher.mock.calls[1][0]).toContain('lang=vi');
    expect(result).toMatchObject({
      locationName: 'Quận 1, Thành phố Hồ Chí Minh',
      current: {temperature: 29.6},
      hourly: {length: 8},
      daily: {length: 5},
    });
  });

  test('uses a readable fallback when reverse geocoding is empty', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(response(currentWeatherFixture))
      .mockResolvedValueOnce(response(forecastFixture))
      .mockResolvedValueOnce(response([]));

    await expect(
      fetchWeather(16.46, 107.59, 'student-key', fetcher as typeof fetch),
    ).resolves.toMatchObject({locationName: 'Vị trí hiện tại'});
  });

  test('classifies a rejected request as a network error', async () => {
    const fetcher = jest.fn().mockRejectedValue(new TypeError('Network failed'));

    await expect(
      fetchWeather(10.77, 106.7, 'student-key', fetcher as typeof fetch),
    ).rejects.toEqual(
      expect.objectContaining<Partial<WeatherServiceError>>({
        code: 'network-error',
      }),
    );
  });

  test('classifies a non-success response as an API error', async () => {
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(response({message: 'Invalid key'}, false, 401))
      .mockResolvedValueOnce(response(forecastFixture))
      .mockResolvedValueOnce(response([]));

    await expect(
      fetchWeather(10.77, 106.7, 'student-key', fetcher as typeof fetch),
    ).rejects.toMatchObject({code: 'api-error'});
  });

  test('classifies malformed JSON as an API error', async () => {
    const broken = {
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError('Bad JSON')),
    } as unknown as Response;
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce(broken)
      .mockResolvedValueOnce(response(forecastFixture))
      .mockResolvedValueOnce(response([]));

    await expect(
      fetchWeather(10.77, 106.7, 'student-key', fetcher as typeof fetch),
    ).rejects.toMatchObject({code: 'api-error'});
  });
});
