import React from 'react';
import AppIcon, {type AntDesignIconName} from './AppIcon';

type Props = {
  icon: string;
  description: string;
  size?: number;
};

const iconForWeather = (code: string): AntDesignIconName => {
  const group = code.slice(0, 2);
  if (group === '01') {
    return code.endsWith('n') ? 'moon' : 'sun';
  }
  if (group === '11') {
    return 'thunderbolt';
  }
  if (group === '13') {
    return 'star';
  }
  if (group === '50') {
    return 'ellipsis';
  }
  return 'cloud';
};

const colorForWeather = (code: string): string => {
  const group = code.slice(0, 2);
  if (group === '01') {
    return code.endsWith('n') ? '#7C8DB5' : '#F4B942';
  }
  if (group === '11') {
    return '#E0A800';
  }
  if (group === '13') {
    return '#7DB7E8';
  }
  return '#4A90E2';
};

const WeatherIcon = ({icon, description, size = 64}: Props) => (
  <AppIcon
    accessibilityLabel={`Thời tiết: ${description}`}
    color={colorForWeather(icon)}
    name={iconForWeather(icon)}
    size={size}
    testID={'weather-icon'}
  />
);

export default WeatherIcon;
