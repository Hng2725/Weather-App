import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {colors} from '../theme/colors';
import AppIcon from './AppIcon';

type Props = {
  kind: 'loading' | 'empty' | 'error';
  message?: string;
  onRetry?: () => void;
};

const WeatherStateView = ({kind, message, onRetry}: Props) => {
  const text =
    message ??
    (kind === 'loading'
      ? 'Đang tải thời tiết...'
      : kind === 'empty'
        ? 'Chưa có dữ liệu thời tiết.'
        : 'Đã xảy ra lỗi.');

  return (
    <View style={styles.container}>
      {kind === 'loading' ? (
        <ActivityIndicator color={colors.textOnDark} size={'large'} />
      ) : (
        <AppIcon
          color={colors.textOnDark}
          name={kind === 'empty' ? 'inbox' : 'warning'}
          size={48}
          testID={`state-icon-${kind}`}
        />
      )}
      <Text style={styles.message}>{text}</Text>
      {kind === 'error' && onRetry ? (
        <Pressable
          accessibilityRole={'button'}
          testID={'state-retry'}
          onPress={onRetry}
          style={styles.button}>
          <Text style={styles.buttonText}>Thử lại</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 28,
  },
  message: {
    color: colors.textOnDark,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  buttonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});

export default WeatherStateView;
