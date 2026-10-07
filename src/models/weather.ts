export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type WeatherMetrics = {
  humidity?: number;
  windSpeed?: number;
  windDegrees?: number;
  uvIndex?: number;
  rainVolume?: number;
  pressure?: number;
  visibility?: number;
};

export type CurrentWeather = WeatherMetrics & {
  timestamp: number;
  temperature: number;
  feelsLike: number;
  high: number;
  low: number;
  description: string;
  icon: string;
};

export type HourlyWeather = WeatherMetrics & {
  timestamp: number;
  temperature: number;
  feelsLike: number;
  description: string;
  icon: string;
  rainProbability: number;
};

export type DailyWeather = WeatherMetrics & {
  timestamp: number;
  high: number;
  low: number;
  feelsLike: number;
  description: string;
  icon: string;
  rainProbability: number;
};

export type WeatherData = {
  locationName: string;
  timezoneOffset: number;
  current: CurrentWeather;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
};
