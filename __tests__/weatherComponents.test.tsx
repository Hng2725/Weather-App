import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import type {
  CurrentWeather,
  DailyWeather,
  HourlyWeather,
} from '../src/models/weather';
import CurrentWeatherCard from '../src/components/CurrentWeatherCard';
import DailyForecast from '../src/components/DailyForecast';
import HourlyForecast from '../src/components/HourlyForecast';
import WeatherMetricGrid from '../src/components/WeatherMetricGrid';
import WeatherStateView from '../src/components/WeatherStateView';

const timestamp = Date.UTC(2026, 9, 6, 23, 0, 0) / 1000;
const timezoneOffset = 7 * 60 * 60;

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

const render = async (element: React.ReactElement) => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await act(() => {
    renderer = ReactTestRenderer.create(element);
  });
  return renderer;
};

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

describe('weather presentation components', () => {
  test('current card shows current, high, low and feels-like temperatures', async () => {
    const renderer = await render(<CurrentWeatherCard weather={current} />);
    const tree = renderer.toJSON();
    const output = textContent(tree);

    expect(output).toContain('30°');
    expect(output).toContain('mưa nhẹ');
    expect(output).toContain('Cao 32°');
    expect(output).toContain('Thấp 24°');
    expect(output).toContain('Cảm nhận 33°');
    expect(JSON.stringify(tree)).not.toContain('openweathermap.org/img/wn');
    expect(
      renderer.root.findByProps({testID: 'weather-icon'}).props
        .accessibilityLabel,
    ).toBe('Thời tiết: mưa nhẹ');
  });

  test('hourly forecast shows required values and selects the pressed hour', async () => {
    const onSelect = jest.fn();
    const renderer = await render(
      <HourlyForecast
        items={[hourly]}
        timezoneOffset={timezoneOffset}
        onSelect={onSelect}
      />,
    );
    const output = textContent(renderer.toJSON());

    expect(output).toContain('06:00');
    expect(output).toContain('30°');
    expect(output).toContain('42%');
    expect(output).not.toContain('💧');
    expect(
      renderer.root.findByProps({testID: 'hourly-rain-icon'}),
    ).toBeDefined();
    act(() => {
      renderer.root.findByProps({testID: `hourly-${timestamp}`}).props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith(hourly);
  });

  test('daily forecast shows date, temperature range and rain chance', async () => {
    const onSelect = jest.fn();
    const renderer = await render(
      <DailyForecast
        items={[daily]}
        timezoneOffset={timezoneOffset}
        onSelect={onSelect}
      />,
    );
    const output = textContent(renderer.toJSON());

    expect(output).toMatch(/Thứ (4|Tư), 07\/10/);
    expect(output).toContain('32° / 24°');
    expect(output).toContain('55%');
    expect(output).not.toContain('💧');
    expect(
      renderer.root.findByProps({testID: 'daily-rain-icon'}),
    ).toBeDefined();
    act(() => {
      renderer.root.findByProps({testID: `daily-${timestamp}`}).props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith(daily);
  });

  test('metric grid shows all eight assignment metrics', async () => {
    const renderer = await render(<WeatherMetricGrid weather={current} />);
    const output = textContent(renderer.toJSON());

    expect(output).toContain('Nhiệt độ');
    expect(output).toContain('30°');
    expect(output).toContain('Độ ẩm');
    expect(output).toContain('78%');
    expect(output).toContain('Tốc độ gió');
    expect(output).toContain('3.5 m/s');
    expect(output).toContain('Hướng gió');
    expect(output).toContain('ĐN');
    expect(output).toContain('Chỉ số UV');
    expect(output).toContain('6.4');
    expect(output).toContain('Lượng mưa');
    expect(output).toContain('1.2 mm');
    expect(output).toContain('Áp suất');
    expect(output).toContain('1008 hPa');
    expect(output).toContain('Tầm nhìn');
    expect(output).toContain('10 km');
    expect(output).not.toMatch(/[🌡💧💨🧭☀🌧⏱👁]/u);
    const metricIconIds = new Set(
      renderer.root
        .findAll(
          node =>
            typeof node.props.testID === 'string' &&
            node.props.testID.startsWith('metric-icon-'),
        )
        .map(node => node.props.testID),
    );
    expect(metricIconIds).toEqual(
      new Set([
        'metric-icon-temperature',
        'metric-icon-humidity',
        'metric-icon-wind-speed',
        'metric-icon-wind-direction',
        'metric-icon-uv',
        'metric-icon-rain',
        'metric-icon-pressure',
        'metric-icon-visibility',
      ]),
    );
  });

  test('metric icons use suitable colors and humidity uses a water drop', async () => {
    const renderer = await render(<WeatherMetricGrid weather={current} />);
    const expectedIcons = [
      ['temperature', 'dashboard', '#F97316'],
      ['humidity', 'water-outline', '#2F80ED'],
      ['wind-speed', 'swap', '#38BDF8'],
      ['wind-direction', 'compass', '#8B5CF6'],
      ['uv', 'sun', '#F59E0B'],
      ['rain', 'cloud', '#3B82F6'],
      ['pressure', 'line-chart', '#64748B'],
      ['visibility', 'eye', '#14B8A6'],
    ] as const;

    expectedIcons.forEach(([key, name, color]) => {
      const renderedIcon = renderer.root.findAll(
        node =>
          node.props.testID === `metric-icon-${key}` &&
          node.props.name === name &&
          node.props.color === color,
      );

      expect(renderedIcon.length).toBeGreaterThan(0);
    });
  });

  test('metric grid protects optional values from undefined and NaN', async () => {
    const renderer = await render(
      <WeatherMetricGrid
        weather={{
          ...current,
          humidity: undefined,
          windSpeed: undefined,
          windDegrees: undefined,
          uvIndex: undefined,
          rainVolume: undefined,
          pressure: undefined,
          visibility: undefined,
        }}
      />,
    );
    const output = textContent(renderer.toJSON());

    expect(output).toContain('--');
    expect(output).not.toContain('undefined');
    expect(output).not.toContain('NaN');
  });

  test('state view renders loading, empty and retryable error states', async () => {
    const retry = jest.fn();
    const loading = await render(<WeatherStateView kind="loading" />);
    const empty = await render(
      <WeatherStateView kind="empty" message="Không có dữ liệu." />,
    );
    const error = await render(
      <WeatherStateView kind="error" message="Mất kết nối." onRetry={retry} />,
    );

    expect(textContent(loading.toJSON())).toContain('Đang tải thời tiết');
    expect(textContent(empty.toJSON())).toContain('Không có dữ liệu.');
    expect(textContent(error.toJSON())).toContain('Mất kết nối.');
    expect(empty.root.findByProps({testID: 'state-icon-empty'})).toBeDefined();
    expect(error.root.findByProps({testID: 'state-icon-error'})).toBeDefined();
    act(() => {
      error.root.findByProps({testID: 'state-retry'}).props.onPress();
    });
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
