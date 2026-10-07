jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  requestAuthorization: jest.fn(),
  getCurrentPosition: jest.fn(),
}));

import Geolocation, {
  type GeolocationError,
  type GeolocationResponse,
} from '@react-native-community/geolocation';
import {PermissionsAndroid, Platform} from 'react-native';
import {
  getCurrentCoordinates,
  requestLocationPermission,
} from '../src/services/locationService';

const mockGeolocation = Geolocation as jest.Mocked<typeof Geolocation>;

const setPlatform = (os: 'android' | 'ios') => {
  Object.defineProperty(Platform, 'OS', {value: os, configurable: true});
};

describe('locationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    [PermissionsAndroid.RESULTS.GRANTED, 'granted'],
    [PermissionsAndroid.RESULTS.DENIED, 'denied'],
    [PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN, 'blocked'],
  ])('maps Android permission result %s to %s', async (result, expected) => {
    setPlatform('android');
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValue(result);

    await expect(requestLocationPermission()).resolves.toBe(expected);
  });

  test('does not prompt again when Android permission is already granted', async () => {
    setPlatform('android');
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(true);
    const request = jest.spyOn(PermissionsAndroid, 'request');

    await expect(requestLocationPermission()).resolves.toBe('granted');
    expect(request).not.toHaveBeenCalled();
  });

  test('requests when-in-use permission on iOS', async () => {
    setPlatform('ios');
    mockGeolocation.requestAuthorization.mockImplementation(
      (success?: () => void) => success?.(),
    );

    await expect(requestLocationPermission()).resolves.toBe('granted');
    expect(mockGeolocation.setRNConfiguration).toHaveBeenCalledWith({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
    });
  });

  test('returns denied when iOS authorization reports an error', async () => {
    setPlatform('ios');
    mockGeolocation.requestAuthorization.mockImplementation(
      (_success?: () => void, error?: (value: GeolocationError) => void) =>
        error?.({code: 1, message: 'Denied'} as GeolocationError),
    );

    await expect(requestLocationPermission()).resolves.toBe('denied');
  });

  test('resolves GPS coordinates with mobile-friendly options', async () => {
    mockGeolocation.getCurrentPosition.mockImplementation(
      (success: (position: GeolocationResponse) => void) =>
        success({
          coords: {latitude: 10.77, longitude: 106.7},
        } as GeolocationResponse),
    );

    await expect(getCurrentCoordinates()).resolves.toEqual({
      latitude: 10.77,
      longitude: 106.7,
    });
    expect(mockGeolocation.getCurrentPosition.mock.calls[0][2]).toEqual({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
  });

  test.each([
    [1, 'permission-denied'],
    [2, 'location-unavailable'],
    [3, 'location-timeout'],
  ])('maps GPS error %s to %s', async (code, expectedCode) => {
    mockGeolocation.getCurrentPosition.mockImplementation(
      (
        _success: (position: GeolocationResponse) => void,
        error?: (value: GeolocationError) => void,
      ) => error?.({code, message: 'GPS error'} as GeolocationError),
    );

    await expect(getCurrentCoordinates()).rejects.toMatchObject({
      code: expectedCode,
    });
  });
});
