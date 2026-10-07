const isFiniteNumber = (value: number | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const formatTemperature = (value?: number): string =>
  isFiniteNumber(value) ? `${Math.round(value)}°` : '--';

export const formatRainChance = (value?: number): string =>
  isFiniteNumber(value) ? `${Math.round(value * 100)}%` : '--';

export const formatVisibility = (metres?: number): string => {
  if (!isFiniteNumber(metres)) {
    return '--';
  }

  const kilometres = metres / 1000;
  const displayValue = Number.isInteger(kilometres)
    ? kilometres.toString()
    : kilometres.toFixed(1).replace(/\.0$/, '');
  return `${displayValue} km`;
};

const directions = ['B', 'ĐB', 'Đ', 'ĐN', 'N', 'TN', 'T', 'TB'];

export const formatWindDirection = (degrees?: number): string => {
  if (!isFiniteNumber(degrees)) {
    return '--';
  }

  const normalized = ((degrees % 360) + 360) % 360;
  return directions[Math.round(normalized / 45) % directions.length];
};

const localDate = (timestamp: number, offsetSeconds: number): Date =>
  new Date((timestamp + offsetSeconds) * 1000);

export const formatForecastTime = (
  timestamp: number,
  offsetSeconds: number,
): string =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(localDate(timestamp, offsetSeconds));

export const formatForecastDay = (
  timestamp: number,
  offsetSeconds: number,
): string =>
  new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'UTC',
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  }).format(localDate(timestamp, offsetSeconds));
