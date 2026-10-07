import React from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import type {HourlyWeather} from '../models/weather';
import {
  formatForecastTime,
  formatRainChance,
  formatTemperature,
} from '../utils/weatherFormatters';
import {colors} from '../theme/colors';
import AppIcon from './AppIcon';
import WeatherIcon from './WeatherIcon';

type Props = {
  items: HourlyWeather[];
  timezoneOffset: number;
  onSelect: (item: HourlyWeather) => void;
};

const HourlyForecast = ({items, timezoneOffset, onSelect}: Props) => (
  <View>
    <Text style={styles.title}>24 giờ tới</Text>
    <FlatList
      horizontal
      data={items}
      keyExtractor={item => item.timestamp.toString()}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.list}
      renderItem={({item}) => (
        <Pressable
          accessibilityRole="button"
          testID={`hourly-${item.timestamp}`}
          onPress={() => onSelect(item)}
          style={({pressed}) => [styles.item, pressed && styles.pressed]}>
          <Text style={styles.time}>
            {formatForecastTime(item.timestamp, timezoneOffset)}
          </Text>
          <WeatherIcon
            icon={item.icon}
            description={item.description}
            size={54}
          />
          <Text style={styles.temperature}>
            {formatTemperature(item.temperature)}
          </Text>
          <View style={styles.rain}>
            <AppIcon
              color={colors.primary}
              name={'cloud'}
              size={13}
              testID={'hourly-rain-icon'}
            />
            <Text style={styles.rainText}>
              {formatRainChance(item.rainProbability)}
            </Text>
          </View>
        </Pressable>
      )}
    />
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
    gap: 10,
    paddingRight: 4,
  },
  item: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 18,
    minWidth: 86,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  pressed: {
    opacity: 0.75,
  },
  time: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  temperature: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  rain: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 5,
  },
  rainText: {
    color: colors.primary,
    fontSize: 12,
  },
});

export default HourlyForecast;
