import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import type {CurrentWeather} from '../models/weather';
import {formatTemperature} from '../utils/weatherFormatters';
import {colors} from '../theme/colors';
import WeatherIcon from './WeatherIcon';

type Props = {
  weather: CurrentWeather;
};

const CurrentWeatherCard = ({weather}: Props) => (
  <View style={styles.card}>
    <View style={styles.mainRow}>
      <View>
        <Text style={styles.label}>Hiện tại</Text>
        <Text style={styles.temperature}>
          {formatTemperature(weather.temperature)}
        </Text>
        <Text style={styles.description}>{weather.description}</Text>
      </View>
      <WeatherIcon
        icon={weather.icon}
        description={weather.description}
        size={96}
      />
    </View>
    <View style={styles.summaryRow}>
      <Text style={styles.summary}>Cao {formatTemperature(weather.high)}</Text>
      <Text style={styles.summary}>Thấp {formatTemperature(weather.low)}</Text>
      <Text style={styles.summary}>
        Cảm nhận {formatTemperature(weather.feelsLike)}
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 5,
  },
  mainRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  temperature: {
    color: colors.text,
    fontSize: 58,
    fontWeight: '300',
    lineHeight: 68,
  },
  description: {
    color: colors.text,
    fontSize: 18,
    textTransform: 'capitalize',
  },
  summaryRow: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 16,
    paddingTop: 14,
  },
  summary: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CurrentWeatherCard;
