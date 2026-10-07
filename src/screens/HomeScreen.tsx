import React, {useEffect, useRef} from 'react';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import CurrentWeatherCard from '../components/CurrentWeatherCard';
import AppIcon from '../components/AppIcon';
import DailyForecast from '../components/DailyForecast';
import HourlyForecast from '../components/HourlyForecast';
import WeatherMetricGrid from '../components/WeatherMetricGrid';
import WeatherStateView from '../components/WeatherStateView';
import {useWeather} from '../hooks/useWeather';
import type {RootStackParamList} from '../navigation/types';
import {colors} from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({navigation}: Props) => {
  const {status, data, message, isRefreshing, reload} = useWeather();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    if (status === 'success' && data) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [data, opacity, status, translateY]);

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <WeatherStateView kind="loading" message={message} />
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />
        <WeatherStateView
          kind={status === 'empty' ? 'empty' : 'error'}
          message={message}
          onRetry={reload}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={reload}
            refreshing={isRefreshing}
            tintColor={colors.textOnDark}
          />
        }
        showsVerticalScrollIndicator={false}>
        <Animated.View
          style={[styles.content, {opacity, transform: [{translateY}]}]}>
          <View style={styles.header}>
            <View style={styles.locationBlock}>
              <Text style={styles.eyebrow}>THỜI TIẾT TẠI</Text>
              <View style={styles.locationRow}>
                <AppIcon
                  color={colors.textOnDark}
                  name={'environment'}
                  size={19}
                  style={styles.locationIcon}
                  testID={'home-location-icon'}
                />
                <Text style={styles.location}>{data.locationName}</Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="Tải lại thời tiết"
              accessibilityRole="button"
              testID="weather-refresh"
              onPress={reload}
              style={({pressed}) => [
                styles.refreshButton,
                pressed && styles.pressed,
              ]}>
              <AppIcon
                color={colors.textOnDark}
                name={'reload'}
                size={24}
                testID={'home-refresh-icon'}
              />
            </Pressable>
          </View>

          {status !== 'success' && message ? (
            <View style={styles.refreshError}>
              <Text style={styles.refreshErrorText}>{message}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={reload}
                style={styles.refreshErrorButton}>
                <Text style={styles.refreshErrorButtonText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : null}

          <CurrentWeatherCard weather={data.current} />
          <View style={styles.section}>
            <HourlyForecast
              items={data.hourly}
              timezoneOffset={data.timezoneOffset}
              onSelect={forecast =>
                navigation.navigate('WeatherDetail', {
                  kind: 'hourly',
                  forecast,
                  timezoneOffset: data.timezoneOffset,
                })
              }
            />
          </View>
          <View style={styles.section}>
            <DailyForecast
              items={data.daily}
              timezoneOffset={data.timezoneOffset}
              onSelect={forecast =>
                navigation.navigate('WeatherDetail', {
                  kind: 'daily',
                  forecast,
                  timezoneOffset: data.timezoneOffset,
                })
              }
            />
          </View>
          <View style={styles.section}>
            <WeatherMetricGrid weather={data.current} />
          </View>
        </Animated.View>
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
    paddingBottom: 32,
  },
  content: {
    alignSelf: 'center',
    maxWidth: 720,
    paddingHorizontal: 16,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 18,
    paddingTop: 14,
  },
  locationBlock: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    color: '#BFD7FF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  location: {
    color: colors.textOnDark,
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
  },
  locationIcon: {
    marginRight: 6,
  },
  locationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 4,
  },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 20,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  pressed: {
    opacity: 0.7,
  },
  refreshError: {
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 14,
    flexDirection: 'row',
    marginBottom: 14,
    padding: 12,
  },
  refreshErrorText: {
    color: '#664D03',
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  refreshErrorButton: {
    marginLeft: 10,
    padding: 5,
  },
  refreshErrorButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
  },
});

export default HomeScreen;
