import React from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import WeatherIcon from '../components/WeatherIcon';
import type {RootStackParamList} from '../navigation/types';
import {colors} from '../theme/colors';
import {
  formatForecastDay,
  formatForecastTime,
  formatRainChance,
  formatTemperature,
  formatVisibility,
  formatWindDirection,
} from '../utils/weatherFormatters';

type Props = NativeStackScreenProps<RootStackParamList, 'WeatherDetail'>;

type DetailRow = {
  label: string;
  value: string;
  available: boolean;
};

const valueWithUnit = (value: number | undefined, unit: string): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? unit === '%'
      ? `${value}%`
      : `${value} ${unit}`.trim()
    : '--';

const WeatherDetailScreen = ({route}: Props) => {
  const {kind, forecast, timezoneOffset} = route.params;
  const isHourly = kind === 'hourly';
  const title = isHourly ? 'Chi tiết theo giờ' : 'Chi tiết theo ngày';
  const date = isHourly
    ? formatForecastTime(forecast.timestamp, timezoneOffset)
    : formatForecastDay(forecast.timestamp, timezoneOffset);

  const rows: DetailRow[] = [
    {
      label: 'Cảm nhận',
      value: formatTemperature(forecast.feelsLike),
      available: Number.isFinite(forecast.feelsLike),
    },
    {
      label: 'Khả năng mưa',
      value: formatRainChance(forecast.rainProbability),
      available: Number.isFinite(forecast.rainProbability),
    },
    {
      label: 'Độ ẩm',
      value: valueWithUnit(forecast.humidity, '%'),
      available: forecast.humidity !== undefined,
    },
    {
      label: 'Tốc độ gió',
      value: valueWithUnit(forecast.windSpeed, 'm/s'),
      available: forecast.windSpeed !== undefined,
    },
    {
      label: 'Hướng gió',
      value: formatWindDirection(forecast.windDegrees),
      available: forecast.windDegrees !== undefined,
    },
    {
      label: 'Chỉ số UV',
      value: valueWithUnit(forecast.uvIndex, ''),
      available: forecast.uvIndex !== undefined,
    },
    {
      label: 'Lượng mưa',
      value: valueWithUnit(forecast.rainVolume, 'mm'),
      available: forecast.rainVolume !== undefined,
    },
    {
      label: 'Áp suất',
      value: valueWithUnit(forecast.pressure, 'hPa'),
      available: forecast.pressure !== undefined,
    },
    {
      label: 'Tầm nhìn',
      value: formatVisibility(forecast.visibility),
      available: forecast.visibility !== undefined,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.date}>{date}</Text>
          <View style={styles.hero}>
            <WeatherIcon
              icon={forecast.icon}
              description={forecast.description}
              size={100}
            />
            <Text style={styles.description}>{forecast.description}</Text>
            {isHourly ? (
              <Text style={styles.temperature}>
                {formatTemperature(forecast.temperature)}
              </Text>
            ) : (
              <View style={styles.range}>
                <Text style={styles.rangeText}>
                  Cao {formatTemperature(forecast.high)}
                </Text>
                <Text style={styles.rangeText}>
                  Thấp {formatTemperature(forecast.low)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.details}>
            {rows
              .filter(row => row.available)
              .map(row => (
                <View key={row.label} style={styles.detailRow}>
                  <Text style={styles.detailLabel}>{row.label}</Text>
                  <Text style={styles.detailValue}>{row.value}</Text>
                </View>
              ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 28,
  },
  content: {
    alignSelf: 'center',
    maxWidth: 720,
    padding: 18,
    width: '100%',
  },
  title: {
    color: colors.textOnDark,
    fontSize: 24,
    fontWeight: '800',
  },
  date: {
    color: '#BFD7FF',
    fontSize: 15,
    marginTop: 5,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 24,
    marginTop: 20,
    padding: 22,
  },
  description: {
    color: colors.textMuted,
    fontSize: 18,
    textTransform: 'capitalize',
  },
  temperature: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '300',
    marginTop: 4,
  },
  range: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
  },
  rangeText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  details: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginTop: 18,
    overflow: 'hidden',
    paddingHorizontal: 18,
  },
  detailRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 54,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 15,
  },
  detailValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default WeatherDetailScreen;
