import type {DailyWeather, HourlyWeather} from '../models/weather';

export type WeatherDetailParams =
  | {
      kind: 'hourly';
      forecast: HourlyWeather;
      timezoneOffset: number;
    }
  | {
      kind: 'daily';
      forecast: DailyWeather;
      timezoneOffset: number;
    };

export type RootStackParamList = {
  Home: undefined;
  WeatherDetail: WeatherDetailParams;
};
