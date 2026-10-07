import type {
  CurrentWeather,
  DailyWeather,
  HourlyWeather,
  WeatherData,
} from '../models/weather';

type JsonObject = Record<string, unknown>;

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const numberValue = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const weatherDescription = (
  value: unknown,
): {description: string; icon: string} | null => {
  if (!Array.isArray(value) || !isObject(value[0])) {
    return null;
  }

  const description = value[0].description;
  const icon = value[0].icon;
  return typeof description === 'string' && typeof icon === 'string'
    ? {description, icon}
    : null;
};

const rainVolume = (value: unknown, period: '1h' | '3h'): number | undefined =>
  isObject(value) ? numberValue(value[period]) : undefined;

const mapForecastPeriod = (value: unknown): HourlyWeather | null => {
  if (!isObject(value) || !isObject(value.main)) {
    return null;
  }

  const timestamp = numberValue(value.dt);
  const temperature = numberValue(value.main.temp);
  const feelsLike = numberValue(value.main.feels_like);
  const condition = weatherDescription(value.weather);
  if (
    timestamp === undefined ||
    temperature === undefined ||
    feelsLike === undefined ||
    !condition
  ) {
    return null;
  }

  const wind = isObject(value.wind) ? value.wind : {};
  return {
    timestamp,
    temperature,
    feelsLike,
    ...condition,
    rainProbability: numberValue(value.pop) ?? 0,
    humidity: numberValue(value.main.humidity),
    windSpeed: numberValue(wind.speed),
    windDegrees: numberValue(wind.deg),
    rainVolume: rainVolume(value.rain, '3h'),
    pressure: numberValue(value.main.pressure),
    visibility: numberValue(value.visibility),
  };
};

const localHour = (timestamp: number, timezoneOffset: number): number => {
  const secondsInDay = 24 * 60 * 60;
  const localSeconds = (timestamp + timezoneOffset) % secondsInDay;
  return Math.floor((localSeconds + secondsInDay) % secondsInDay / 3600);
};

const mapDaily = (
  periods: HourlyWeather[],
  timezoneOffset: number,
): DailyWeather => {
  const representative = periods.reduce((closest, item) =>
    Math.abs(localHour(item.timestamp, timezoneOffset) - 12) <
    Math.abs(localHour(closest.timestamp, timezoneOffset) - 12)
      ? item
      : closest,
  );
  const rainValues = periods
    .map(item => item.rainVolume)
    .filter((value): value is number => value !== undefined);

  return {
    timestamp: representative.timestamp,
    high: Math.max(...periods.map(item => item.temperature)),
    low: Math.min(...periods.map(item => item.temperature)),
    feelsLike: representative.feelsLike,
    description: representative.description,
    icon: representative.icon,
    rainProbability: Math.max(
      ...periods.map(item => item.rainProbability),
    ),
    humidity: representative.humidity,
    windSpeed: representative.windSpeed,
    windDegrees: representative.windDegrees,
    rainVolume:
      rainValues.length > 0
        ? Number(rainValues.reduce((sum, value) => sum + value, 0).toFixed(2))
        : undefined,
    pressure: representative.pressure,
    visibility: representative.visibility,
  };
};

const groupDaily = (
  periods: HourlyWeather[],
  timezoneOffset: number,
): DailyWeather[] => {
  const groups = new Map<number, HourlyWeather[]>();
  for (const period of periods) {
    const day = Math.floor(
      (period.timestamp + timezoneOffset) / (24 * 60 * 60),
    );
    groups.set(day, [...(groups.get(day) ?? []), period]);
  }
  return Array.from(groups.values()).map(items =>
    mapDaily(items, timezoneOffset),
  );
};

const mapCurrent = (
  value: unknown,
  today: DailyWeather,
): CurrentWeather | null => {
  if (!isObject(value) || !isObject(value.main)) {
    return null;
  }

  const timestamp = numberValue(value.dt);
  const temperature = numberValue(value.main.temp);
  const feelsLike = numberValue(value.main.feels_like);
  const condition = weatherDescription(value.weather);
  if (
    timestamp === undefined ||
    temperature === undefined ||
    feelsLike === undefined ||
    !condition
  ) {
    return null;
  }

  const wind = isObject(value.wind) ? value.wind : {};
  return {
    timestamp,
    temperature,
    feelsLike,
    high: today.high,
    low: today.low,
    ...condition,
    humidity: numberValue(value.main.humidity),
    windSpeed: numberValue(wind.speed),
    windDegrees: numberValue(wind.deg),
    rainVolume: rainVolume(value.rain, '1h'),
    pressure: numberValue(value.main.pressure),
    visibility: numberValue(value.visibility),
  };
};

export const mapWeatherResponse = (
  currentRaw: unknown,
  forecastRaw: unknown,
  locationName: string,
): WeatherData | null => {
  if (
    !isObject(currentRaw) ||
    !isObject(forecastRaw) ||
    !Array.isArray(forecastRaw.list) ||
    forecastRaw.list.length < 8
  ) {
    return null;
  }

  const timezoneOffset = isObject(forecastRaw.city)
    ? numberValue(forecastRaw.city.timezone) ?? 0
    : numberValue(currentRaw.timezone) ?? 0;
  const mappedPeriods = forecastRaw.list.map(mapForecastPeriod);
  if (mappedPeriods.some(item => item === null)) {
    return null;
  }

  const validPeriods = mappedPeriods as HourlyWeather[];
  const daily = groupDaily(validPeriods, timezoneOffset).slice(0, 5);
  if (daily.length < 5) {
    return null;
  }

  const current = mapCurrent(currentRaw, daily[0]);
  if (!current) {
    return null;
  }

  return {
    locationName,
    timezoneOffset,
    current,
    hourly: validPeriods.slice(0, 8),
    daily,
  };
};
