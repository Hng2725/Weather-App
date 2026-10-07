import Geolocation, {
  type GeolocationError,
} from '@react-native-community/geolocation';
import {PermissionsAndroid, Platform} from 'react-native';
import type {Coordinates} from '../models/weather';

export type LocationPermission = 'granted' | 'denied' | 'blocked';

export type LocationErrorCode =
  | 'permission-denied'
  | 'location-unavailable'
  | 'location-timeout';

export class LocationServiceError extends Error {
  constructor(
    public readonly code: LocationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'LocationServiceError';
  }
}

const requestAndroidPermission = async (): Promise<LocationPermission> => {
  const permission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
  if (await PermissionsAndroid.check(permission)) {
    return 'granted';
  }

  const result = await PermissionsAndroid.request(permission, {
    title: 'Quyền truy cập vị trí',
    message: 'Ứng dụng cần vị trí để hiển thị thời tiết hiện tại.',
    buttonPositive: 'Đồng ý',
    buttonNegative: 'Từ chối',
  });

  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return 'granted';
  }
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
    return 'blocked';
  }
  return 'denied';
};

const requestIosPermission = (): Promise<LocationPermission> => {
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
  });

  return new Promise(resolve => {
    Geolocation.requestAuthorization(
      () => resolve('granted'),
      () => resolve('denied'),
    );
  });
};

export const requestLocationPermission = (): Promise<LocationPermission> =>
  Platform.OS === 'android'
    ? requestAndroidPermission()
    : requestIosPermission();

const locationError = (error: GeolocationError): LocationServiceError => {
  if (error.code === 1) {
    return new LocationServiceError(
      'permission-denied',
      'Ứng dụng chưa được cấp quyền vị trí.',
    );
  }
  if (error.code === 3) {
    return new LocationServiceError(
      'location-timeout',
      'Không lấy được vị trí trong thời gian cho phép.',
    );
  }
  return new LocationServiceError(
    'location-unavailable',
    'Không thể lấy vị trí. Hãy kiểm tra GPS trên thiết bị.',
  );
};

export const getCurrentCoordinates = (): Promise<Coordinates> =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
          reject(
            new LocationServiceError(
              'location-unavailable',
              'Thiết bị trả về tọa độ không hợp lệ.',
            ),
          );
          return;
        }
        resolve({latitude, longitude});
      },
      error => reject(locationError(error)),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      },
    );
  });
