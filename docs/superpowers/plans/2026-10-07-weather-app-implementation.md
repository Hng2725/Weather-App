# Weather App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng ứng dụng React Native Android/iOS hiển thị thời tiết thật tại vị trí hiện tại, dự báo 24 giờ, dự báo 7 ngày và màn hình chi tiết.

**Architecture:** `HomeScreen` dùng hook `useWeather` để điều phối quyền vị trí, GPS và hai request OpenWeather chạy song song. Dữ liệu JSON được mapper chuyển thành model nội bộ trước khi truyền vào các component trình bày; màn hình chi tiết nhận bản ghi đã chuẩn hóa qua React Navigation.

**Tech Stack:** React Native 0.87.1, React 19.2.3, TypeScript, React Navigation 7, `@react-native-community/geolocation` 3.4.0, Jest, `react-test-renderer`, OpenWeather One Call 3.0.

**Spec:** `docs/superpowers/specs/2026-10-07-weather-app-design.md`

## Global Constraints

- Chỉ xây dựng ứng dụng React Native native cho Android và iOS; không thêm React Native Web hoặc Expo.
- Giao diện và thông báo hướng đến bài tập học sinh, dùng tiếng Việt và giữ code dễ đọc.
- Dữ liệu chạy thật phải đến từ OpenWeather; fixture chỉ được dùng trong test.
- Chỉ thêm một dependency sản phẩm mới: `@react-native-community/geolocation@3.4.0`.
- API dùng `units=metric`, `lang=vi`; lấy tối đa 24 mục giờ và 7 mục ngày.
- API key thật nằm trong `src/config/openWeather.ts` bị Git ignore; chỉ commit file mẫu.
- Không dùng Redux, Zustand, thư viện UI, thư viện HTTP hoặc thư viện animation ngoài React Native.
- Giữ nguyên các chỉnh sửa hiện có của người dùng trong `MainActivity.kt`, `android/gradle.properties` và các dependency navigation.
- Không xóa các màn hình mẫu không còn được import; tránh phá hủy file chưa commit của người dùng.

## Review Focus

- GPS bị tắt hoặc hết thời gian chờ phải hiện lỗi vị trí và cho phép thử lại, không crash — kiểm tra ở Task 3 và Task 5.
- Người dùng chọn “Không hỏi lại” trên Android phải nhận trạng thái `blocked` và hướng dẫn mở cài đặt — kiểm tra ở Task 3 và Task 5.
- Hai lần refresh hoàn tất sai thứ tự không được để response cũ ghi đè response mới — kiểm tra ở Task 5.
- Reverse Geocoding trả mảng rỗng vẫn phải hiển thị “Vị trí hiện tại” và giữ dữ liệu thời tiết — kiểm tra ở Task 2.
- Trường tùy chọn như mưa, gust hoặc visibility bị thiếu không được hiển thị `NaN`/`undefined` — kiểm tra ở Task 1 và Task 4.

---

## File map

- `src/models/weather.ts`: model nội bộ và kiểu route dùng chung.
- `src/utils/weatherFormatters.ts`: định dạng dữ liệu để hiển thị.
- `src/services/weatherMapper.ts`: ánh xạ JSON OpenWeather sang model.
- `src/services/weatherService.ts`: gọi API và phân loại lỗi.
- `src/services/locationService.ts`: quyền vị trí và GPS native.
- `src/hooks/useWeather.ts`: state machine và vòng đời request.
- `src/components/*`: các khối giao diện thuần props.
- `src/screens/*`: ghép component thành hai màn hình.
- `src/navigation/types.ts`: kiểu native stack.
- `App.tsx`: cấu hình navigation của ứng dụng.
- `android/app/src/main/AndroidManifest.xml`, `ios/MyNewProject/Info.plist`: quyền vị trí.
- `README.md`: cách cấu hình API key và chạy ứng dụng.

### Task 1: Model, mapper và formatter thời tiết

**Files:**
- Create: `src/models/weather.ts`
- Create: `src/services/weatherMapper.ts`
- Create: `src/utils/weatherFormatters.ts`
- Create: `__tests__/weatherMapper.test.ts`
- Create: `__tests__/weatherFormatters.test.ts`
- Create: `__tests__/fixtures/openWeather.ts`

**Interfaces:**
- Consumes: JSON `unknown` từ One Call và tên địa điểm dạng `string`.
- Produces: `Coordinates`, `WeatherMetrics`, `CurrentWeather`, `HourlyWeather`, `DailyWeather`, `WeatherData`; `mapWeatherResponse(raw: unknown, locationName: string): WeatherData | null`; `formatTemperature(value?: number): string`; `formatRainChance(value?: number): string`; `formatVisibility(metres?: number): string`; `formatForecastTime(timestamp: number, offsetSeconds: number): string`; `formatForecastDay(timestamp: number, offsetSeconds: number): string`; `formatWindDirection(degrees?: number): string`.

- [ ] **Step 1: Viết test mapper thất bại**

  Tạo fixture tối thiểu có `current`, 25 bản ghi `hourly`, 8 bản ghi `daily`; test `maps_weather_and_limits_forecasts` khẳng định địa điểm được giữ nguyên, high/low lấy từ `daily[0]`, `hourly.length === 24`, `daily.length === 7`, `pop` và các trường mưa tùy chọn được bảo toàn. Test `returns_null_when_required_sections_are_missing` truyền object thiếu `current` và mong `null`.

- [ ] **Step 2: Chạy test mapper để xác nhận RED**

  Run: `npx jest __tests__/weatherMapper.test.ts --runInBand`

  Expected: FAIL vì `weatherMapper` và model chưa tồn tại.

- [ ] **Step 3: Cài đặt model và `mapWeatherResponse` tối thiểu**

  Các metric tùy chọn dùng `number | undefined`; mọi forecast giữ `timestamp` Unix giây, `timezoneOffset` nằm ở `WeatherData`; không tự tạo số 0 cho trường API bị thiếu.

- [ ] **Step 4: Chạy test mapper để xác nhận GREEN**

  Run: `npx jest __tests__/weatherMapper.test.ts --runInBand`

  Expected: PASS tất cả test trong file.

- [ ] **Step 5: Viết test formatter thất bại**

  Test các giá trị khóa: `29.6 -> "30°"`, `undefined -> "--"`, `0.42 -> "42%"`, `10000 -> "10 km"`, hướng `0/90/180/270 -> B/Đ/N/T`, degree thiếu `-> "--"`; thời gian/ngày dùng UTC cộng `offsetSeconds`, không phụ thuộc timezone máy chạy test.

- [ ] **Step 6: Chạy test formatter để xác nhận RED**

  Run: `npx jest __tests__/weatherFormatters.test.ts --runInBand`

  Expected: FAIL vì module formatter chưa tồn tại.

- [ ] **Step 7: Cài đặt các formatter**

  Dùng `Intl.DateTimeFormat('vi-VN', {timeZone: 'UTC'})` sau khi cộng offset; formatter phải trả `--` khi giá trị không hữu hạn.

- [ ] **Step 8: Chạy toàn bộ test Task 1**

  Run: `npx jest __tests__/weatherMapper.test.ts __tests__/weatherFormatters.test.ts --runInBand`

  Expected: PASS.

- [ ] **Step 9: Commit Task 1**

  ```bash
  git add src/models/weather.ts src/services/weatherMapper.ts src/utils/weatherFormatters.ts __tests__/weatherMapper.test.ts __tests__/weatherFormatters.test.ts __tests__/fixtures/openWeather.ts
  git commit -m "feat: add weather data mapping and formatting"
  ```

### Task 2: Cấu hình và OpenWeather service

**Files:**
- Create: `src/config/openWeather.example.ts`
- Create local only: `src/config/openWeather.ts`
- Modify: `.gitignore`
- Create: `src/services/weatherService.ts`
- Create: `__tests__/weatherService.test.ts`

**Interfaces:**
- Consumes: `mapWeatherResponse(raw, locationName)` từ Task 1, tọa độ và API key.
- Produces: `WeatherServiceErrorCode = 'config-error' | 'network-error' | 'api-error'`; `WeatherServiceError`; `fetchWeather(latitude: number, longitude: number, apiKey?: string, fetcher?: typeof fetch): Promise<WeatherData | null>`.

- [ ] **Step 1: Viết test service thất bại**

  Các test mock `fetcher` và khẳng định: thiếu/placeholder key ném `config-error`; hai URL chứa lat/lon đã encode, `units=metric`, `lang=vi`, `appid`; hai request được tạo trước khi chờ kết quả; HTTP lỗi ném `api-error`; fetch reject ném `network-error`; reverse geocoding `[]` dùng tên “Vị trí hiện tại”; response hợp lệ gọi mapper và trả model.

- [ ] **Step 2: Chạy test để xác nhận RED**

  Run: `npx jest __tests__/weatherService.test.ts --runInBand`

  Expected: FAIL vì service/config chưa tồn tại.

- [ ] **Step 3: Tạo cấu hình mẫu và ignore khóa thật**

  `openWeather.example.ts` export `OPEN_WEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY'`; thêm `/src/config/openWeather.ts` vào `.gitignore`; tạo bản local cùng nội dung để typecheck/build chạy nhưng tuyệt đối không stage file này.

- [ ] **Step 4: Cài đặt `WeatherServiceError` và `fetchWeather`**

  Dùng `Promise.all` cho One Call và Reverse Geocoding; One Call URL loại `minutely,alerts`; mọi JSON lỗi parse hoặc HTTP không `ok` thành `api-error`; mapper trả `null` được giữ nguyên cho empty state.

- [ ] **Step 5: Chạy test Task 2**

  Run: `npx jest __tests__/weatherService.test.ts --runInBand`

  Expected: PASS.

- [ ] **Step 6: Commit Task 2**

  ```bash
  git add .gitignore src/config/openWeather.example.ts src/services/weatherService.ts __tests__/weatherService.test.ts
  git commit -m "feat: add OpenWeather API service"
  ```

### Task 3: Quyền vị trí và GPS native

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/services/locationService.ts`
- Create: `__tests__/locationService.test.ts`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `ios/MyNewProject/Info.plist`

**Interfaces:**
- Consumes: `Coordinates` từ Task 1; `PermissionsAndroid`, `Platform`; `@react-native-community/geolocation`.
- Produces: `LocationPermission = 'granted' | 'denied' | 'blocked'`; `LocationErrorCode = 'permission-denied' | 'location-unavailable' | 'location-timeout'`; `LocationServiceError`; `requestLocationPermission(): Promise<LocationPermission>`; `getCurrentCoordinates(): Promise<Coordinates>`.

- [ ] **Step 1: Cài dependency GPS**

  Run: `npm install @react-native-community/geolocation@3.4.0`

  Expected: package và lockfile chứa đúng phiên bản tương thích React Native >= 0.73.

- [ ] **Step 2: Viết test quyền/GPS thất bại**

  Mock platform và native modules. Kiểm tra Android `GRANTED/DENIED/NEVER_ASK_AGAIN`; iOS callback success/error; GPS success ánh xạ lat/lon; error code 1/2/3 lần lượt thành permission-denied/location-unavailable/location-timeout, gồm trường hợp GPS tắt hoặc timeout.

- [ ] **Step 3: Chạy test để xác nhận RED**

  Run: `npx jest __tests__/locationService.test.ts --runInBand`

  Expected: FAIL vì `locationService` chưa tồn tại.

- [ ] **Step 4: Cài đặt service vị trí**

  `getCurrentCoordinates` dùng `{enableHighAccuracy: true, timeout: 15000, maximumAge: 60000}`; cấu hình authorization iOS là `whenInUse`; không gọi API thời tiết khi quyền chưa granted.

- [ ] **Step 5: Khai báo quyền native**

  Android thêm `ACCESS_FINE_LOCATION` và `ACCESS_COARSE_LOCATION`; iOS đặt `NSLocationWhenInUseUsageDescription` thành “Ứng dụng cần vị trí của bạn để hiển thị thời tiết hiện tại.”

- [ ] **Step 6: Chạy test Task 3**

  Run: `npx jest __tests__/locationService.test.ts --runInBand`

  Expected: PASS.

- [ ] **Step 7: Commit Task 3**

  ```bash
  git add package.json package-lock.json src/services/locationService.ts __tests__/locationService.test.ts android/app/src/main/AndroidManifest.xml ios/MyNewProject/Info.plist
  git commit -m "feat: add device location support"
  ```

### Task 4: Component trình bày và trạng thái màn hình

**Files:**
- Create: `src/components/WeatherIcon.tsx`
- Create: `src/components/CurrentWeatherCard.tsx`
- Create: `src/components/HourlyForecast.tsx`
- Create: `src/components/DailyForecast.tsx`
- Create: `src/components/WeatherMetricGrid.tsx`
- Create: `src/components/WeatherStateView.tsx`
- Create: `src/theme/colors.ts`
- Create: `__tests__/weatherComponents.test.tsx`

**Interfaces:**
- Consumes: model và formatter từ Task 1.
- Produces: sáu component thuần props; `HourlyForecast` gọi `onSelect(item: HourlyWeather)`; `DailyForecast` gọi `onSelect(item: DailyWeather)`; `WeatherStateView` nhận `kind: 'loading' | 'empty' | 'error'`, `message?: string`, `onRetry?: () => void`.

- [ ] **Step 1: Viết test component thất bại**

  Dùng `react-test-renderer`; kiểm tra current card có nhiệt độ/trạng thái/cao-thấp/cảm nhận; hourly có giờ/icon/nhiệt độ/mưa và gọi đúng `onSelect`; daily có ngày/cao-thấp/mưa và gọi đúng `onSelect`; metrics có đủ nhiệt độ, độ ẩm, tốc độ gió, hướng gió, UV, lượng mưa, áp suất, tầm nhìn; trường tùy chọn thiếu hiển thị `--`, không có chuỗi `undefined` hoặc `NaN`; state view render loading, empty, error và nút retry.

- [ ] **Step 2: Chạy test để xác nhận RED**

  Run: `npx jest __tests__/weatherComponents.test.tsx --runInBand`

  Expected: FAIL vì component chưa tồn tại.

- [ ] **Step 3: Cài đặt component tối thiểu**

  Dùng `Image` cho icon OpenWeather, `FlatList` ngang cho hourly, các `Pressable` có `testID`, grid `flexWrap` hai cột và màu trong `colors.ts`; không gọi API hay GPS trong component.

- [ ] **Step 4: Chạy test Task 4**

  Run: `npx jest __tests__/weatherComponents.test.tsx --runInBand`

  Expected: PASS.

- [ ] **Step 5: Commit Task 4**

  ```bash
  git add src/components src/theme/colors.ts __tests__/weatherComponents.test.tsx
  git commit -m "feat: add weather presentation components"
  ```

### Task 5: Hook điều phối dữ liệu và trạng thái

**Files:**
- Create: `src/hooks/useWeather.ts`
- Create: `__tests__/useWeather.test.tsx`

**Interfaces:**
- Consumes: `requestLocationPermission`, `getCurrentCoordinates`, `fetchWeather`, `OPEN_WEATHER_API_KEY`.
- Produces: `WeatherStatus = 'loading' | 'success' | 'empty' | 'permission-denied' | 'permission-blocked' | 'location-error' | 'config-error' | 'network-error' | 'api-error'`; `WeatherDependencies`; `UseWeatherResult {status, data, message, isRefreshing, reload}`; `useWeather(dependencies?: Partial<WeatherDependencies>): UseWeatherResult`.

- [ ] **Step 1: Viết test hook thất bại**

  Dùng component harness với dependencies inject. Kiểm tra: mount chạy permission → GPS → API và đạt success; denied/blocked không gọi GPS/API; API trả `null` thành empty; `LocationServiceError` timeout thành location-error; từng `WeatherServiceError` giữ đúng status; reload giữ data cũ với `isRefreshing=true`; hai reload giải quyết ngược thứ tự chỉ nhận kết quả request mới; unmount trước khi promise xong không cập nhật state.

- [ ] **Step 2: Chạy test để xác nhận RED**

  Run: `npx jest __tests__/useWeather.test.tsx --runInBand`

  Expected: FAIL vì hook chưa tồn tại.

- [ ] **Step 3: Cài đặt state machine của hook**

  Dùng `mountedRef` và `requestIdRef`; `reload` là callback ổn định; lần tải đầu là `loading`, lần tải lại chỉ bật `isRefreshing`; message tiếng Việt được chọn theo status.

- [ ] **Step 4: Chạy test Task 5**

  Run: `npx jest __tests__/useWeather.test.tsx --runInBand`

  Expected: PASS, không có cảnh báo cập nhật state sau unmount.

- [ ] **Step 5: Commit Task 5**

  ```bash
  git add src/hooks/useWeather.ts __tests__/useWeather.test.tsx
  git commit -m "feat: orchestrate weather loading states"
  ```

### Task 6: Hai màn hình, navigation, animation và hướng dẫn chạy

**Files:**
- Create: `src/navigation/types.ts`
- Create: `src/screens/HomeScreen.tsx`
- Create: `src/screens/WeatherDetailScreen.tsx`
- Modify: `App.tsx`
- Modify: `__tests__/App.test.tsx`
- Create: `__tests__/weatherScreens.test.tsx`
- Modify: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: `useWeather`, các component Task 4, `HourlyWeather`, `DailyWeather`.
- Produces: `RootStackParamList { Home: undefined; WeatherDetail: {kind: 'hourly' | 'daily'; forecast: HourlyWeather | DailyWeather; timezoneOffset: number} }`; `HomeScreen`; `WeatherDetailScreen`; ứng dụng navigation hoàn chỉnh.

- [ ] **Step 1: Viết test màn hình/navigation thất bại**

  Mock hook cho từng status. Kiểm tra Home render loading/error/empty; success hiển thị location và các section; chọn hourly/daily gọi `navigation.navigate('WeatherDetail', params)` đúng kind/item/offset; refresh gọi `reload`; detail giờ/ngày hiển thị tiêu đề, mô tả và các metric có sẵn nhưng ẩn dòng không có dữ liệu.

- [ ] **Step 2: Chạy test để xác nhận RED**

  Run: `npx jest __tests__/weatherScreens.test.tsx --runInBand`

  Expected: FAIL vì screens mới chưa tồn tại.

- [ ] **Step 3: Cài đặt navigation và screens**

  Home dùng `SafeAreaView`, `ScrollView`, `RefreshControl`; fade/slide một lần bằng `Animated.Value`; Detail dùng route typed và `ScrollView`; App chỉ đăng ký `Home` và `WeatherDetail`, header native có tiêu đề tiếng Việt.

- [ ] **Step 4: Cập nhật smoke test App và script typecheck**

  Mock `useWeather` ở loading để App test không gọi GPS; thêm script `"typecheck": "tsc --noEmit"`; test App render `NavigationContainer` không throw.

- [ ] **Step 5: Viết hướng dẫn cấu hình và chạy**

  README nêu rõ copy `src/config/openWeather.example.ts` thành `src/config/openWeather.ts`, thay placeholder bằng key One Call đã kích hoạt, chạy `npm install`, Android/iOS commands, cấp GPS và các lệnh test/lint/typecheck.

- [ ] **Step 6: Chạy test màn hình và App**

  Run: `npx jest __tests__/weatherScreens.test.tsx __tests__/App.test.tsx --runInBand`

  Expected: PASS.

- [ ] **Step 7: Chạy toàn bộ kiểm tra JavaScript/TypeScript**

  Run: `npm test -- --runInBand`

  Expected: PASS toàn bộ test, 0 failed.

  Run: `npm run lint`

  Expected: exit 0, không có ESLint error.

  Run: `npm run typecheck`

  Expected: exit 0, không có TypeScript error.

- [ ] **Step 8: Build Android debug**

  Run: `.\android\gradlew.bat -p android assembleDebug`

  Expected: `BUILD SUCCESSFUL`; APK nằm trong `android/app/build/outputs/apk/debug/`.

- [ ] **Step 9: Đối chiếu tiêu chí hoàn thành**

  Mở spec và xác nhận từng mục: hai màn hình, GPS, dữ liệu thật, 24 giờ, 7 ngày, chi tiết, tám nhóm chỉ số, loading/error/empty, refresh, responsive layout và animation đều có code/test tương ứng.

- [ ] **Step 10: Commit Task 6**

  ```bash
  git add App.tsx src/navigation src/screens __tests__/App.test.tsx __tests__/weatherScreens.test.tsx README.md package.json
  git commit -m "feat: complete native weather application"
  ```

