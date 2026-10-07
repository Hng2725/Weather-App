import React from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import type {DailyWeather} from '../models/weather';
import {
  formatForecastDay,
  formatRainChance,
  formatTemperature,
} from '../utils/weatherFormatters';
import {colors} from '../theme/colors';
import AppIcon from './AppIcon';
import WeatherIcon from './WeatherIcon';

type Props = {
  items: DailyWeather[];
  timezoneOffset: number;
  onSelect: (item: DailyWeather) => void;
};

const DailyForecast = ({items, timezoneOffset, onSelect}: Props) => (
  <View>
    <Text style={styles.title}>Dự báo 5 ngày</Text>
    <View style={styles.list}>
      {items.map(item => (
        <Pressable
          accessibilityRole="button"
          testID={`daily-${item.timestamp}`}
          key={item.timestamp}
          onPress={() => onSelect(item)}
          style={({pressed}) => [styles.item, pressed && styles.pressed]}>
          <View style={styles.dayBlock}>
            <Text style={styles.day}>
              {formatForecastDay(item.timestamp, timezoneOffset)}
            </Text>
            <Text numberOfLines={1} style={styles.description}>
              {item.description}
            </Text>
          </View>
          <WeatherIcon
            icon={item.icon}
            description={item.description}
            size={48}
          />
          <View style={styles.values}>
            <Text style={styles.temperature}>
              {formatTemperature(item.high)} / {formatTemperature(item.low)}
            </Text>
            <View style={styles.rain}>
              <AppIcon
                color={colors.primary}
                name={'cloud'}
                size={13}
                testID={'daily-rain-icon'}
              />
              <Text style={styles.rainText}>
                {formatRainChance(item.rainProbability)}
              </Text>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  title: {
    color: colors.textOnDark,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  list: {
    gap: 9,
  },
  item: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  pressed: {
    opacity: 0.75,
  },
  dayBlock: {
    flex: 1,
  },
  day: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  description: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 3,
    textTransform: 'capitalize',
  },
  values: {
    alignItems: 'flex-end',
    minWidth: 90,
  },
  temperature: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  rain: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 4,
  },
  rainText: {
    color: colors.primary,
    fontSize: 12,
  },
});

export default DailyForecast;
