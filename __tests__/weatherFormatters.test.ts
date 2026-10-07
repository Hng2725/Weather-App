import {
  formatForecastDay,
  formatForecastTime,
  formatRainChance,
  formatTemperature,
  formatVisibility,
  formatWindDirection,
} from '../src/utils/weatherFormatters';

describe('weather formatters', () => {
  test('formats numeric weather values and protects missing values', () => {
    expect(formatTemperature(29.6)).toBe('30°');
    expect(formatTemperature(undefined)).toBe('--');
    expect(formatTemperature(Number.NaN)).toBe('--');
    expect(formatRainChance(0.42)).toBe('42%');
    expect(formatRainChance(undefined)).toBe('--');
    expect(formatVisibility(10000)).toBe('10 km');
    expect(formatVisibility(1500)).toBe('1.5 km');
    expect(formatVisibility(undefined)).toBe('--');
  });

  test.each([
    [0, 'B'],
    [90, 'Đ'],
    [180, 'N'],
    [270, 'T'],
    [360, 'B'],
  ])('formats wind direction %s degrees as %s', (degrees, expected) => {
    expect(formatWindDirection(degrees)).toBe(expected);
  });

  test('returns a placeholder when wind direction is missing', () => {
    expect(formatWindDirection(undefined)).toBe('--');
    expect(formatWindDirection(Number.POSITIVE_INFINITY)).toBe('--');
  });

  test('formats forecast time using the location timezone offset', () => {
    const timestamp = Date.UTC(2026, 9, 6, 23, 0, 0) / 1000;

    expect(formatForecastTime(timestamp, 7 * 60 * 60)).toBe('06:00');
    expect(formatForecastDay(timestamp, 7 * 60 * 60)).toMatch(
      /^Thứ (4|Tư), 07\/10$/,
    );
  });
});
