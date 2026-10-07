/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('../src/hooks/useWeather', () => ({
  useWeather: () => ({
    status: 'loading',
    data: null,
    message: 'Đang tải thời tiết...',
    isRefreshing: false,
    reload: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

import App from '../App';
import HomeScreen from '../src/screens/HomeScreen';

test('renders the weather navigator at the home screen', async () => {
  jest.useFakeTimers();
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    jest.runAllTimers();
  });

  expect(renderer.root.findByType(HomeScreen)).toBeTruthy();
  jest.useRealTimers();
});
