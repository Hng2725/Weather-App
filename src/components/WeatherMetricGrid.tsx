import React from 'react';
import MaterialDesignIcons, {
  type MaterialDesignIconsIconName,
} from '@react-native-vector-icons/material-design-icons/static';
import {StyleSheet, Text, View} from 'react-native';
import type {WeatherMetrics} from '../models/weather';
import {
  formatTemperature,
  formatVisibility,
  formatWindDirection,
} from '../utils/weatherFormatters';
import {colors} from '../theme/colors';
import AppIcon, {type AntDesignIconName} from './AppIcon';

type MetricWeather = WeatherMetrics & {temperature?: number};

type Props = {
  weather: MetricWeather;
  title?: string;
};

type MetricBase = {
  key: string;
  label: string;
  value: string;
};

type Metric = MetricBase &
  (
    | {icon: AntDesignIconName; iconFamily?: 'ant-design'}
    | {icon: MaterialDesignIconsIconName; iconFamily: 'material-design'}
  );

const metricIconColors: Record<string, string> = {
  temperature: '#F97316',
  humidity: '#2F80ED',
  'wind-speed': '#38BDF8',
  'wind-direction': '#8B5CF6',
  uv: '#F59E0B',
  rain: '#3B82F6',
  pressure: '#64748B',
  visibility: '#14B8A6',
};

const numberWithUnit = (value: number | undefined, unit: string): string => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '--';
  }
  if (unit === '%') {
    return `${value}%`;
  }
  return unit ? `${value} ${unit}` : value.toString();
};

const WeatherMetricGrid = ({weather, title = 'Chỉ số thời tiết'}: Props) => {
  const metrics: Metric[] = [
    {key: 'temperature', icon: 'dashboard', label: 'Nhiệt độ', value: formatTemperature(weather.temperature)},
    {key: 'humidity', icon: 'water-outline', iconFamily: 'material-design', label: 'Độ ẩm', value: numberWithUnit(weather.humidity, '%')},
    {key: 'wind-speed', icon: 'swap', label: 'Tốc độ gió', value: numberWithUnit(weather.windSpeed, 'm/s')},
    {key: 'wind-direction', icon: 'compass', label: 'Hướng gió', value: formatWindDirection(weather.windDegrees)},
    {key: 'uv', icon: 'sun', label: 'Chỉ số UV', value: numberWithUnit(weather.uvIndex, '')},
    {key: 'rain', icon: 'cloud', label: 'Lượng mưa', value: numberWithUnit(weather.rainVolume, 'mm')},
    {key: 'pressure', icon: 'line-chart', label: 'Áp suất', value: numberWithUnit(weather.pressure, 'hPa')},
    {key: 'visibility', icon: 'eye', label: 'Tầm nhìn', value: formatVisibility(weather.visibility)},
  ];

  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        {metrics.map(metric => (
          <View key={metric.key} style={styles.item}>
            {metric.iconFamily === 'material-design' ? (
              <MaterialDesignIcons
                accessibilityRole={'image'}
                color={metricIconColors[metric.key]}
                name={metric.icon}
                size={23}
                style={styles.icon}
                testID={`metric-icon-${metric.key}`}
              />
            ) : (
              <AppIcon
                color={metricIconColors[metric.key]}
                name={metric.icon}
                size={23}
                style={styles.icon}
                testID={`metric-icon-${metric.key}`}
              />
            )}
            <View style={styles.textBlock}>
              <Text style={styles.label}>{metric.label}</Text>
              <Text style={styles.value}>{metric.value}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    color: colors.textOnDark,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  item: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    flexDirection: 'row',
    minHeight: 82,
    padding: 13,
    width: '48%',
  },
  icon: {
    marginRight: 9,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 4,
  },
});

export default WeatherMetricGrid;
