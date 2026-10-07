import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {OPEN_WEATHER_API_KEY} from '../config/openWeather';
import type {Coordinates, WeatherData} from '../models/weather';
import {
  getCurrentCoordinates,
  LocationServiceError,
  requestLocationPermission,
  type LocationPermission,
} from '../services/locationService';
import {
  fetchWeather,
  WeatherServiceError,
} from '../services/weatherService';

export type WeatherStatus =
  | 'loading'
  | 'success'
  | 'empty'
  | 'permission-denied'
  | 'permission-blocked'
  | 'location-error'
  | 'config-error'
  | 'network-error'
  | 'api-error';

export type WeatherDependencies = {
  requestLocationPermission: () => Promise<LocationPermission>;
  getCurrentCoordinates: () => Promise<Coordinates>;
  fetchWeather: (
    latitude: number,
    longitude: number,
  ) => Promise<WeatherData | null>;
};

export type UseWeatherResult = {
  status: WeatherStatus;
  data: WeatherData | null;
  message: string;
  isRefreshing: boolean;
  reload: () => Promise<void>;
};

type WeatherState = Omit<UseWeatherResult, 'reload'>;

const messages: Record<WeatherStatus, string> = {
  loading: 'Đang tải thời tiết...',
  success: '',
  empty: 'Không có đủ dữ liệu dự báo cho vị trí này.',
  'permission-denied':
    'Bạn đã từ chối quyền vị trí. Hãy cấp quyền để xem thời tiết hiện tại.',
  'permission-blocked':
    'Quyền vị trí đã bị chặn. Hãy mở Cài đặt thiết bị để cấp lại quyền.',
  'location-error': 'Không thể lấy vị trí. Hãy kiểm tra GPS và thử lại.',
  'config-error': 'Bạn chưa cấu hình OpenWeather API key.',
  'network-error': 'Không thể kết nối mạng. Vui lòng thử lại.',
  'api-error': 'Không thể tải dữ liệu từ OpenWeather. Vui lòng thử lại.',
};

const defaults: WeatherDependencies = {
  requestLocationPermission,
  getCurrentCoordinates,
  fetchWeather: (latitude, longitude) =>
    fetchWeather(latitude, longitude, OPEN_WEATHER_API_KEY),
};

const initialState: WeatherState = {
  status: 'loading',
  data: null,
  message: messages.loading,
  isRefreshing: false,
};

export const useWeather = (
  dependencyOverrides?: Partial<WeatherDependencies>,
): UseWeatherResult => {
  const dependencies = useMemo(
    () => ({...defaults, ...dependencyOverrides}),
    [dependencyOverrides],
  );
  const [state, setState] = useState<WeatherState>(initialState);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const reload = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setState(previous =>
      previous.data
        ? {...previous, isRefreshing: true, message: ''}
        : {...initialState},
    );

    const update = (next: WeatherState) => {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setState(next);
      }
    };

    try {
      const permission = await dependencies.requestLocationPermission();
      if (permission !== 'granted') {
        const status =
          permission === 'blocked'
            ? 'permission-blocked'
            : 'permission-denied';
        update({
          status,
          data: null,
          message: messages[status],
          isRefreshing: false,
        });
        return;
      }

      const coordinates = await dependencies.getCurrentCoordinates();
      const data = await dependencies.fetchWeather(
        coordinates.latitude,
        coordinates.longitude,
      );
      if (!data) {
        update({
          status: 'empty',
          data: null,
          message: messages.empty,
          isRefreshing: false,
        });
        return;
      }

      update({
        status: 'success',
        data,
        message: '',
        isRefreshing: false,
      });
    } catch (error) {
      let status: WeatherStatus = 'api-error';
      if (error instanceof LocationServiceError) {
        status = 'location-error';
      } else if (error instanceof WeatherServiceError) {
        status = error.code;
      }
      if (mountedRef.current && requestId === requestIdRef.current) {
        setState(previous => ({
          status,
          data: previous.data,
          message: previous.data
            ? `${messages[status]} Đang hiển thị dữ liệu gần nhất.`
            : messages[status],
          isRefreshing: false,
        }));
      }
    }
  }, [dependencies]);

  useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  return {...state, reload};
};
