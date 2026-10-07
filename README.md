# Ứng dụng dự báo thời tiết React Native

Ứng dụng sử dụng vị trí GPS của điện thoại và dữ liệu thật từ OpenWeather để hiển thị:

- Thời tiết hiện tại và nhiệt độ cảm nhận.
- Dự báo 24 giờ tiếp theo theo từng mốc 3 giờ.
- Dự báo 5 ngày tiếp theo.
- Thông tin chi tiết của giờ hoặc ngày được chọn.
- Nhiệt độ, độ ẩm, gió, lượng mưa, áp suất và tầm nhìn. Chỉ số UV hiển thị `--` vì API miễn phí không cung cấp dữ liệu này.

Ứng dụng là React Native native cho Android/iOS, không phải website và không có chức năng đăng ký hoặc đăng nhập.

## 1. Chuẩn bị OpenWeather API key

Chỉ cần API key thuộc gói miễn phí. Ứng dụng sử dụng Current Weather API 2.5, 5 Day / 3 Hour Forecast API 2.5 và Reverse Geocoding API; không cần đăng ký One Call.

Sao chép file cấu hình mẫu:

```powershell
Copy-Item src\config\openWeather.example.ts src\config\openWeather.ts
```

Mở `src/config/openWeather.ts` và thay `YOUR_OPENWEATHER_API_KEY` bằng key thật:

```ts
export const OPEN_WEATHER_API_KEY = 'API_KEY_CUA_BAN';
```

File `openWeather.ts` đã được Git ignore để tránh đưa key lên repository. Không chia sẻ API key công khai.

## 2. Cài thư viện

```powershell
npm install
```

Nếu chạy iOS trên macOS, cài CocoaPods sau khi thêm thư viện native:

```sh
cd ios
bundle exec pod install
cd ..
```

## 3. Chạy ứng dụng

Khởi động Metro:

```powershell
npm start
```

Mở terminal khác để chạy Android:

```powershell
npm run android
```

Hoặc chạy iOS trên macOS:

```sh
npm run ios
```

Khi ứng dụng hỏi quyền vị trí, chọn cho phép trong khi sử dụng ứng dụng. Nếu đã chặn quyền, hãy mở phần Cài đặt của thiết bị để cấp lại.

## 4. Kiểm tra mã nguồn

```powershell
npm test -- --runInBand
npm run lint
npm run typecheck
```

Build Android debug:

```powershell
.\android\gradlew.bat -p android assembleDebug
```

APK debug được tạo tại `android/app/build/outputs/apk/debug/`.

## Cấu trúc chính

```text
src/
  components/   Các thẻ và danh sách giao diện
  config/       Cấu hình OpenWeather
  hooks/        Điều phối trạng thái tải dữ liệu
  models/       Kiểu dữ liệu thời tiết
  navigation/   Kiểu route
  screens/      Màn hình tổng quan và chi tiết
  services/     GPS, gọi API và chuyển đổi dữ liệu
  theme/        Màu giao diện
  utils/        Hàm định dạng
```
