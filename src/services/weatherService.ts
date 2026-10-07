import {OPEN_WEATHER_API_KEY} from '../config/openWeather';
import type {WeatherData} from '../models/weather';
import {mapWeatherResponse} from './weatherMapper';

export type WeatherServiceErrorCode =
  | 'config-error'
  | 'network-error'
  | 'api-error';

export class WeatherServiceError extends Error {
  constructor(
    public readonly code: WeatherServiceErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

const isValidApiKey = (apiKey: string | undefined): apiKey is string =>
  Boolean(apiKey?.trim()) && apiKey !== 'YOUR_OPENWEATHER_API_KEY';

const weatherParams = (
  latitude: number,
  longitude: number,
  apiKey: string,
): URLSearchParams =>
  new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),
    units: 'metric',
    lang: 'vi',
    appid: apiKey,
  });

const currentWeatherUrl = (
  latitude: number,
  longitude: number,
  apiKey: string,
): string =>
  `https://api.openweathermap.org/data/2.5/weather?${weatherParams(
    latitude,
    longitude,
    apiKey,
  )}`;

const forecastUrl = (
  latitude: number,
  longitude: number,
  apiKey: string,
): string =>
  `https://api.openweathermap.org/data/2.5/forecast?${weatherParams(
    latitude,
    longitude,
    apiKey,
  )}`;

const reverseGeocodingUrl = (
  latitude: number,
  longitude: number,
  apiKey: string,
): string => {
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),
    limit: '1',
    appid: apiKey,
  });
  return `https://api.openweathermap.org/geo/1.0/reverse?${params}`;
};

const parseJson = async (response: Response): Promise<unknown> => {
  if (!response.ok) {
    throw new WeatherServiceError(
      'api-error',
      `OpenWeather trả về mã lỗi ${response.status}.`,
    );
  }

  try {
    return await response.json();
  } catch {
    throw new WeatherServiceError(
      'api-error',
      'OpenWeather trả về dữ liệu không hợp lệ.',
    );
  }
};

const locationNameFrom = (raw: unknown): string => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return 'Vị trí hiện tại';
  }

  const first = raw[0] as {
    name?: unknown;
    state?: unknown;
    local_names?: {vi?: unknown};
  };
  const localName =
    typeof first.local_names?.vi === 'string'
      ? first.local_names.vi
      : typeof first.name === 'string'
        ? first.name
        : undefined;
  const state = typeof first.state === 'string' ? first.state : undefined;

  return [localName, state].filter(Boolean).join(', ') || 'Vị trí hiện tại';
};

export const fetchWeather = async (
  latitude: number,
  longitude: number,
  apiKey: string = OPEN_WEATHER_API_KEY,
  fetcher: typeof fetch = fetch,
): Promise<WeatherData | null> => {
  if (!isValidApiKey(apiKey)) {
    throw new WeatherServiceError(
      'config-error',
      'Bạn chưa cấu hình OpenWeather API key.',
    );
  }

  let currentResponse: Response;
  let forecastResponse: Response;
  let locationResponse: Response;
  try {
    [currentResponse, forecastResponse, locationResponse] = await Promise.all([
      fetcher(currentWeatherUrl(latitude, longitude, apiKey)),
      fetcher(forecastUrl(latitude, longitude, apiKey)),
      fetcher(reverseGeocodingUrl(latitude, longitude, apiKey)),
    ]);
  } catch {
    throw new WeatherServiceError(
      'network-error',
      'Không thể kết nối mạng. Vui lòng thử lại.',
    );
  }

  const [currentJson, forecastJson, locationJson] = await Promise.all([
    parseJson(currentResponse),
    parseJson(forecastResponse),
    parseJson(locationResponse),
  ]);

  return mapWeatherResponse(
    currentJson,
    forecastJson,
    locationNameFrom(locationJson),
  );
};
