import React from 'react';
import {Animated} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';

jest.mock('../src/hooks/useWeather', () => ({
  useWeather: jest.fn(),
}));

import {useWeather, type UseWeatherResult} from '../src/hooks/useWeather';
import type {
  CurrentWeather,
  DailyWeather,
  HourlyWeather,
  WeatherData,
} from '../src/models/weather';
import HomeScreen from '../src/screens/HomeScreen';
import WeatherDetailScreen from '../src/screens/WeatherDetailScreen';

const mockUseWeather = useWeather as jest.MockedFunction<typeof useWeather>;
const timestamp = Date.UTC(2026, 9, 6, 23, 0, 0) / 1000;

const current: CurrentWeather = {
  timestamp,
  temperature: 29.6,
  feelsLike: 33.2,
  high: 32,
  low: 24,
  description: 'mưa nhẹ',
  icon: '10d',
  humidity: 78,
  windSpeed: 3.5,
  windDegrees: 135,
  uvIndex: 6.4,
  rainVolume: 1.2,
  pressure: 1008,
  visibility: 10000,
};

const hourly: HourlyWeather = {
  ...current,
  rainProbability: 0.42,
};

const daily: DailyWeather = {
  timestamp,
  high: 32,
  low: 24,
  feelsLike: 34,
  description: 'mưa vừa',
  icon: '10d',
  rainProbability: 0.55,
  humidity: 80,
  windSpeed: 4,
  windDegrees: 180,
  uvIndex: 5,
  rainVolume: 2.4,
  pressure: 1007,
};

const data: WeatherData = {
  locationName: 'Quận 1, Thành phố Hồ Chí Minh',
  timezoneOffset: 25200,
  current,
  hourly: [hourly],
  daily: [daily],
};

const result = (
  overrides: Partial<UseWeatherResult> = {},
): UseWeatherResult => ({
  status: 'success',
  data,
  message: '',
  isRefreshing: false,
  reload: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const textContent = (node: unknown): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(textContent).join('');
  }
  if (node && typeof node === 'object' && 'children' in node) {
    return textContent((node as {children?: unknown}).children);
  }
  return '';
};

const render = async (element: React.ReactElement) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    renderer = ReactTestRenderer.create(element);
  });
  return renderer;
};

describe('weather screens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Animated, 'timing').mockReturnValue({
      start: (callback?: (result: {finished: boolean}) => void) =>
        callback?.({finished: true}),
      stop: jest.fn(),
      reset: jest.fn(),
    } as unknown as Animated.CompositeAnimation);
  });

  test.each([
    ['loading', null, 'Đang tải thời tiết'],
    ['empty', null, 'Không có dữ liệu'],
    ['network-error', null, 'Không có mạng'],
  ] as const)('renders the %s state', async (status, stateData, message) => {
    mockUseWeather.mockReturnValue(
      result({status, data: stateData, message}),
    );
    const renderer = await render(
      <HomeScreen
        navigation={{navigate: jest.fn()} as never}
        route={{key: 'Home', name: 'Home'} as never}
      />,
    );

    expect(textContent(renderer.toJSON())).toContain(message);
  });

  test('shows weather sections and handles refresh and forecast selection', async () => {
    const reload = jest.fn().mockResolvedValue(undefined);
    const navigate = jest.fn();
    mockUseWeather.mockReturnValue(result({reload}));
    const renderer = await render(
      <HomeScreen
        navigation={{navigate} as never}
        route={{key: 'Home', name: 'Home'} as never}
      />,
    );
    const output = textContent(renderer.toJSON());

    expect(output).toContain('Quận 1, Thành phố Hồ Chí Minh');
    expect(output).toContain('24 giờ tới');
    expect(output).toContain('Dự báo 5 ngày');
    expect(output).toContain('Chỉ số thời tiết');
    expect(output).not.toContain('📍');
    expect(output).not.toContain('↻');
    expect(
      renderer.root.findByProps({testID: 'home-location-icon'}),
    ).toBeDefined();
    expect(
      renderer.root.findByProps({testID: 'home-refresh-icon'}),
    ).toBeDefined();

    act(() => {
      renderer.root.findByProps({testID: 'weather-refresh'}).props.onPress();
      renderer.root.findByProps({testID: `hourly-${timestamp}`}).props.onPress();
      renderer.root.findByProps({testID: `daily-${timestamp}`}).props.onPress();
    });

    expect(reload).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenNthCalledWith(1, 'WeatherDetail', {
      kind: 'hourly',
      forecast: hourly,
      timezoneOffset: 25200,
    });
    expect(navigate).toHaveBeenNthCalledWith(2, 'WeatherDetail', {
      kind: 'daily',
      forecast: daily,
      timezoneOffset: 25200,
    });
  });

  test('keeps cached weather visible when refresh reports an error', async () => {
    mockUseWeather.mockReturnValue(
      result({
        status: 'network-error',
        data,
        message: 'Không thể cập nhật. Đang hiển thị dữ liệu gần nhất.',
      }),
    );
    const renderer = await render(
      <HomeScreen
        navigation={{navigate: jest.fn()} as never}
        route={{key: 'Home', name: 'Home'} as never}
      />,
    );
    const output = textContent(renderer.toJSON());

    expect(output).toContain('Quận 1, Thành phố Hồ Chí Minh');
    expect(output).toContain('Không thể cập nhật. Đang hiển thị dữ liệu gần nhất.');
  });

  test('hourly detail shows its time, description and available metrics', async () => {
    const renderer = await render(
      <WeatherDetailScreen
        navigation={{} as never}
        route={{
          params: {kind: 'hourly', forecast: hourly, timezoneOffset: 25200},
        } as never}
      />,
    );
    const output = textContent(renderer.toJSON());

    expect(output).toContain('Chi tiết theo giờ');
    expect(output).toContain('06:00');
    expect(output).toContain('mưa nhẹ');
    expect(output).toContain('Khả năng mưa');
    expect(output).toContain('42%');
    expect(output).toContain('Tầm nhìn');
    expect(output).toContain('10 km');
  });

  test('daily detail shows its range and hides unavailable visibility', async () => {
    const renderer = await render(
      <WeatherDetailScreen
        navigation={{} as never}
        route={{
          params: {kind: 'daily', forecast: daily, timezoneOffset: 25200},
        } as never}
      />,
    );
    const output = textContent(renderer.toJSON());

    expect(output).toContain('Chi tiết theo ngày');
    expect(output).toMatch(/Thứ (4|Tư), 07\/10/);
    expect(output).toContain('Cao 32°');
    expect(output).toContain('Thấp 24°');
    expect(output).toContain('55%');
    expect(output).not.toContain('Tầm nhìn');
  });
});
