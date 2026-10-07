import React, {useEffect} from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';

jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  requestAuthorization: jest.fn(),
  getCurrentPosition: jest.fn(),
}));

import type {WeatherData} from '../src/models/weather';
import {LocationServiceError} from '../src/services/locationService';
import {WeatherServiceError} from '../src/services/weatherService';
import {
  type UseWeatherResult,
  type WeatherDependencies,
  useWeather,
} from '../src/hooks/useWeather';

const weatherData: WeatherData = {
  locationName: 'Quận 1, Thành phố Hồ Chí Minh',
  timezoneOffset: 25200,
  current: {
    timestamp: 1760000000,
    temperature: 30,
    feelsLike: 33,
    high: 32,
    low: 24,
    description: 'mưa nhẹ',
    icon: '10d',
  },
  hourly: [],
  daily: [],
};

const newerWeatherData: WeatherData = {
  ...weatherData,
  locationName: 'Huế, Thừa Thiên Huế',
  current: {...weatherData.current, temperature: 27},
};

const createDependencies = (
  overrides: Partial<WeatherDependencies> = {},
): WeatherDependencies => ({
  requestLocationPermission: jest.fn().mockResolvedValue('granted'),
  getCurrentCoordinates: jest
    .fn()
    .mockResolvedValue({latitude: 10.77, longitude: 106.7}),
  fetchWeather: jest.fn().mockResolvedValue(weatherData),
  ...overrides,
});

const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

type HarnessProps = {
  dependencies: WeatherDependencies;
  onRender: (result: UseWeatherResult) => void;
};

const Harness = ({dependencies, onRender}: HarnessProps) => {
  const result = useWeather(dependencies);
  useEffect(() => onRender(result), [onRender, result]);
  return null;
};

const mountHook = async (dependencies: WeatherDependencies) => {
  let latest!: UseWeatherResult;
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  let renderCount = 0;
  const onRender = (result: UseWeatherResult) => {
    latest = result;
    renderCount += 1;
  };

  await act(async () => {
    renderer = ReactTestRenderer.create(
      <Harness dependencies={dependencies} onRender={onRender} />,
    );
    await flush();
  });

  return {
    renderer,
    latest: () => latest,
    renderCount: () => renderCount,
  };
};

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return {promise, resolve, reject};
};

describe('useWeather', () => {
  test('loads permission, coordinates and weather in order', async () => {
    const dependencies = createDependencies();
    const hook = await mountHook(dependencies);

    expect(hook.latest()).toMatchObject({
      status: 'success',
      data: weatherData,
      isRefreshing: false,
    });
    expect(dependencies.requestLocationPermission).toHaveBeenCalledTimes(1);
    expect(dependencies.getCurrentCoordinates).toHaveBeenCalledTimes(1);
    expect(dependencies.fetchWeather).toHaveBeenCalledWith(10.77, 106.7);
  });

  test.each([
    ['denied', 'permission-denied'],
    ['blocked', 'permission-blocked'],
  ] as const)('stops when location permission is %s', async (permission, status) => {
    const dependencies = createDependencies({
      requestLocationPermission: jest.fn().mockResolvedValue(permission),
    });

    const hook = await mountHook(dependencies);

    expect(hook.latest().status).toBe(status);
    expect(dependencies.getCurrentCoordinates).not.toHaveBeenCalled();
    expect(dependencies.fetchWeather).not.toHaveBeenCalled();
  });

  test('uses the empty state when the API has no complete forecast', async () => {
    const dependencies = createDependencies({
      fetchWeather: jest.fn().mockResolvedValue(null),
    });

    const hook = await mountHook(dependencies);

    expect(hook.latest()).toMatchObject({status: 'empty', data: null});
  });

  test('maps a location timeout to the location error state', async () => {
    const dependencies = createDependencies({
      getCurrentCoordinates: jest.fn().mockRejectedValue(
        new LocationServiceError('location-timeout', 'GPS timeout'),
      ),
    });

    const hook = await mountHook(dependencies);

    expect(hook.latest().status).toBe('location-error');
    expect(hook.latest().message).toContain('vị trí');
  });

  test.each([
    ['config-error', 'config-error'],
    ['network-error', 'network-error'],
    ['api-error', 'api-error'],
  ] as const)('preserves weather service status %s', async (code, status) => {
    const dependencies = createDependencies({
      fetchWeather: jest
        .fn()
        .mockRejectedValue(new WeatherServiceError(code, 'Service failed')),
    });

    const hook = await mountHook(dependencies);

    expect(hook.latest().status).toBe(status);
    expect(hook.latest().message).toBeTruthy();
  });

  test('keeps existing data visible while refreshing', async () => {
    const refresh = deferred<WeatherData | null>();
    const fetchWeather = jest
      .fn()
      .mockResolvedValueOnce(weatherData)
      .mockReturnValueOnce(refresh.promise);
    const hook = await mountHook(createDependencies({fetchWeather}));

    act(() => {
      hook.latest().reload().catch(() => undefined);
    });
    expect(hook.latest()).toMatchObject({
      status: 'success',
      data: weatherData,
      isRefreshing: true,
    });

    await act(async () => {
      refresh.resolve(newerWeatherData);
      await flush();
    });
    expect(hook.latest()).toMatchObject({
      status: 'success',
      data: newerWeatherData,
      isRefreshing: false,
    });
  });

  test('keeps cached data when a refresh fails', async () => {
    const fetchWeather = jest
      .fn()
      .mockResolvedValueOnce(weatherData)
      .mockRejectedValueOnce(
        new WeatherServiceError('network-error', 'Network failed'),
      );
    const hook = await mountHook(createDependencies({fetchWeather}));

    await act(async () => {
      await hook.latest().reload();
      await flush();
    });

    expect(hook.latest()).toMatchObject({
      status: 'network-error',
      data: weatherData,
      isRefreshing: false,
    });
  });

  test('ignores an older refresh that finishes after a newer refresh', async () => {
    const older = deferred<WeatherData | null>();
    const newer = deferred<WeatherData | null>();
    const fetchWeather = jest
      .fn()
      .mockResolvedValueOnce(weatherData)
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    const hook = await mountHook(createDependencies({fetchWeather}));

    act(() => {
      hook.latest().reload().catch(() => undefined);
      hook.latest().reload().catch(() => undefined);
    });
    await act(async () => {
      newer.resolve(newerWeatherData);
      await flush();
    });
    expect(hook.latest().data).toBe(newerWeatherData);

    await act(async () => {
      older.resolve(weatherData);
      await flush();
    });
    expect(hook.latest().data).toBe(newerWeatherData);
  });

  test('does not update state after unmount', async () => {
    const pending = deferred<WeatherData | null>();
    const dependencies = createDependencies({
      fetchWeather: jest.fn().mockReturnValue(pending.promise),
    });
    const hook = await mountHook(dependencies);
    const rendersBeforeUnmount = hook.renderCount();

    act(() => hook.renderer.unmount());
    await act(async () => {
      pending.resolve(weatherData);
      await flush();
    });

    expect(hook.renderCount()).toBe(rendersBeforeUnmount);
  });
});
