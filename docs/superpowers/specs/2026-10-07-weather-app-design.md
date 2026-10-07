# Thiết kế ứng dụng dự báo thời tiết

## 1. Mục tiêu

Xây dựng một ứng dụng React Native native cho Android và iOS phục vụ bài tập học sinh. Ứng dụng có giao diện tiếng Việt đơn giản, trực quan, lấy dữ liệu thời tiết thực tế từ OpenWeather và sử dụng vị trí GPS của thiết bị.

Ứng dụng phải dễ đọc, dễ trình bày và không đưa vào các kiến trúc quản lý trạng thái phức tạp khi chưa cần thiết.

## 2. Phạm vi

### Trong phạm vi

- Hiển thị thời tiết hiện tại tại vị trí GPS.
- Hiển thị 24 giờ dự báo tiếp theo.
- Hiển thị 7 ngày dự báo tiếp theo.
- Xem chi tiết một giờ hoặc một ngày được chọn.
- Hiển thị nhiệt độ, độ ẩm, tốc độ và hướng gió, UV, lượng mưa, áp suất và tầm nhìn.
- Hỗ trợ loading, error, empty và tải lại dữ liệu.
- Xử lý quyền vị trí trên Android và iOS.
- Dùng React Navigation để chuyển từ màn hình tổng quan sang chi tiết.
- Dùng dữ liệu thật từ OpenWeather One Call 3.0 và Reverse Geocoding.

### Ngoài phạm vi

- Website hoặc React Native Web.
- Đăng nhập, đồng bộ tài khoản và lưu dữ liệu lên máy chủ.
- Tìm kiếm hoặc lưu nhiều thành phố.
- Thông báo thời tiết nền.
- Bản đồ thời tiết.
- Redux, Zustand hoặc một state manager toàn cục.

## 3. Kiến trúc

Ứng dụng dùng kiến trúc gọn nhẹ:

- `App.tsx` khai báo `NavigationContainer` và native stack.
- `HomeScreen` hiển thị toàn bộ tổng quan thời tiết.
- `WeatherDetailScreen` hiển thị thông tin của giờ hoặc ngày được chọn.
- `useWeather` điều phối quyền vị trí, GPS, API, refresh và trạng thái màn hình.
- `weatherService` gọi OpenWeather và chuyển lỗi HTTP thành lỗi dễ hiểu.
- `locationService` xin quyền và lấy tọa độ thiết bị.
- `weatherMapper` chuyển JSON thô của OpenWeather thành model nội bộ.
- Các component trình bày chỉ nhận props đã chuẩn hóa.

Không dùng Context toàn ứng dụng vì dữ liệu chỉ được tải tại `HomeScreen`. Màn hình chi tiết nhận một bản ghi dự báo đã chuẩn hóa qua route params, vì vậy không gọi lại API.

## 4. Cấu trúc mã nguồn dự kiến

```text
src/
  components/
    CurrentWeatherCard.tsx
    HourlyForecast.tsx
    DailyForecast.tsx
    WeatherMetricGrid.tsx
    WeatherStateView.tsx
  config/
    openWeather.example.ts
    openWeather.ts              # local, bị git ignore
  hooks/
    useWeather.ts
  models/
    weather.ts
  navigation/
    types.ts
  screens/
    HomeScreen.tsx
    WeatherDetailScreen.tsx
  services/
    locationService.ts
    weatherMapper.ts
    weatherService.ts
  utils/
    weatherFormatters.ts
```

Các thư mục màn hình mẫu hiện tại sẽ được thay thế hoặc loại bỏ khi không còn được tham chiếu. Những thay đổi có sẵn của người dùng trong cấu hình React Native và Android được bảo toàn.

## 5. Điều hướng và giao diện

### Màn hình tổng quan

`HomeScreen` dùng `SafeAreaView` và `ScrollView` để tương thích nhiều kích thước màn hình. Nội dung gồm:

1. Header có tên địa điểm và nút tải lại.
2. Thẻ thời tiết hiện tại có nhiệt độ, mô tả, icon, nhiệt độ cao nhất/thấp nhất và cảm nhận.
3. Danh sách 24 giờ cuộn ngang. Mỗi mục có giờ, icon, nhiệt độ và xác suất mưa.
4. Danh sách 7 ngày theo chiều dọc. Mỗi mục có ngày, mô tả, icon, nhiệt độ cao/thấp và xác suất mưa.
5. Lưới hai cột gồm các chỉ số thời tiết.

Chạm vào mục dự báo giờ hoặc ngày sẽ mở `WeatherDetailScreen` bằng native stack transition.

### Màn hình chi tiết

Màn hình chi tiết hiển thị loại dự báo, thời điểm, icon, mô tả và các trường có sẵn trong bản ghi được chọn. Trường không tồn tại trong phản hồi API được ẩn thay vì hiển thị giá trị giả.

### Phong cách

- Màu xanh đậm làm nền chính, thẻ màu xanh nhạt hoặc trắng bán trong suốt.
- Chữ có độ tương phản cao, kích thước phù hợp màn hình điện thoại.
- Icon thời tiết tải từ endpoint icon chính thức của OpenWeather.
- Dùng `Animated` có sẵn của React Native để fade/slide nội dung khi dữ liệu xuất hiện.
- Không dùng thư viện UI lớn hoặc hiệu ứng phức tạp.

## 6. Luồng dữ liệu

1. `HomeScreen` gọi `useWeather` khi được gắn vào cây giao diện.
2. Hook yêu cầu quyền vị trí khi đang sử dụng ứng dụng.
3. Nếu được cấp quyền, `locationService` lấy `latitude` và `longitude` bằng GPS.
4. Hook gọi song song One Call và Reverse Geocoding.
5. Request One Call dùng `units=metric`, `lang=vi` và loại bỏ phần dữ liệu không dùng.
6. `weatherMapper` lấy `current`, 24 phần tử đầu của `hourly` và 7 phần tử đầu của `daily`.
7. Nhiệt độ cao/thấp hiện tại lấy từ `daily[0]`, vì `current` không có đủ hai trường này.
8. Dữ liệu chuẩn hóa được đưa vào các component.
9. Pull-to-refresh hoặc nút thử lại chạy lại toàn bộ luồng từ bước lấy vị trí.

## 7. Model dữ liệu nội bộ

Model nội bộ gồm:

- `CurrentWeather`: nhiệt độ, cảm nhận, cao/thấp, mô tả, icon và toàn bộ chỉ số hiện tại.
- `HourlyWeather`: timestamp, nhiệt độ, cảm nhận, mô tả, icon, xác suất mưa và các chỉ số chi tiết theo giờ.
- `DailyWeather`: timestamp, nhiệt độ cao/thấp, cảm nhận, mô tả, icon, xác suất/lượng mưa và các chỉ số chi tiết theo ngày.
- `WeatherData`: địa điểm, múi giờ, thời tiết hiện tại, danh sách giờ và danh sách ngày.

Timestamp được giữ ở dạng Unix giây và được định dạng theo `timezone_offset` của OpenWeather. Xác suất mưa `pop` được đổi sang phần trăm khi hiển thị. Tốc độ gió dùng m/s và tầm nhìn dùng km.

## 8. API và bảo vệ khóa

- One Call: `https://api.openweathermap.org/data/3.0/onecall`.
- Reverse Geocoding: `https://api.openweathermap.org/geo/1.0/reverse`.
- Icon: `https://openweathermap.org/img/wn/{icon}@2x.png`.
- API key do người dùng cung cấp và đã kích hoạt One Call by Call.

Repo chỉ chứa `openWeather.example.ts`. Người dùng sao chép file này thành `openWeather.ts` và điền khóa. `openWeather.ts` được thêm vào `.gitignore` để tránh commit khóa thật. Nếu khóa chưa được cấu hình hoặc vẫn là placeholder, ứng dụng trả về lỗi cấu hình có hướng dẫn rõ ràng.

Đây là cách phù hợp với bài tập native đơn giản; không tuyên bố đây là cơ chế bảo mật tuyệt đối cho ứng dụng phát hành công khai, vì khóa được đóng gói ở phía client vẫn có thể bị trích xuất.

## 9. Quyền vị trí

- Android khai báo `ACCESS_FINE_LOCATION` và `ACCESS_COARSE_LOCATION` trong manifest, sau đó xin quyền lúc chạy bằng `PermissionsAndroid`.
- iOS dùng `NSLocationWhenInUseUsageDescription` với nội dung tiếng Việt và xin quyền thông qua thư viện geolocation.
- GPS được lấy bằng một thư viện geolocation tương thích React Native bare workflow.
- Nếu người dùng từ chối, màn hình hiển thị giải thích và nút thử lại.
- Nếu quyền bị chặn vĩnh viễn, màn hình hướng dẫn người dùng bật lại trong cài đặt thiết bị.
- Không dùng tọa độ hoặc dữ liệu thời tiết cố định để thay thế khi bị từ chối.

## 10. Trạng thái và xử lý lỗi

Hook sử dụng trạng thái phân biệt:

- `loading`: lần đầu đang lấy vị trí hoặc dữ liệu.
- `success`: có dữ liệu hợp lệ.
- `empty`: API hợp lệ nhưng thiếu dữ liệu hiện tại, giờ hoặc ngày cần thiết.
- `permission-denied`: người dùng không cấp quyền.
- `location-error`: không lấy được GPS hoặc hết thời gian chờ.
- `config-error`: thiếu API key.
- `network-error`: mất mạng hoặc request thất bại.
- `api-error`: OpenWeather trả về HTTP không thành công hoặc JSON không hợp lệ.

Mỗi lỗi có thông báo tiếng Việt ngắn gọn và hành động phù hợp. Các lỗi kỹ thuật không làm ứng dụng crash.

## 11. Bất đồng bộ và vòng đời

- API được gọi bằng `fetch` để tránh thêm thư viện HTTP.
- `Promise.all` tải thời tiết và tên địa điểm song song.
- Hook không cập nhật state sau khi component đã unmount.
- Refresh giữ dữ liệu cũ trên màn hình khi có thể và hiển thị trạng thái đang tải lại.
- Mỗi lần refresh chỉ tạo một chuỗi request đang hoạt động nhằm tránh dữ liệu cũ ghi đè dữ liệu mới.

## 12. Kiểm thử

Thực hiện theo TDD cho các phần logic có thể kiểm thử ổn định:

- Mapper chuyển JSON OpenWeather thành model nội bộ.
- Giới hạn đúng 24 giờ và 7 ngày.
- Formatter nhiệt độ, phần trăm mưa, tầm nhìn, thời gian và hướng gió.
- Phân loại lỗi API và lỗi cấu hình.
- Render loading, error và empty.
- Render dữ liệu thành công và sự kiện chọn dự báo.
- Navigation nhận đúng route params cho chi tiết giờ/ngày.

Test được phép dùng fixture giả lập; code chạy thật không dùng dữ liệu cố định. Các request mạng và geolocation được mock trong test.

Xác minh cuối gồm:

- Jest.
- ESLint.
- TypeScript typecheck.
- Android debug build.

## 13. Tiêu chí hoàn thành

- Ứng dụng Android/iOS native mở được và điều hướng giữa hai màn hình.
- Với API key hợp lệ và quyền GPS, dữ liệu thật của vị trí hiện tại được hiển thị.
- Có đúng tối đa 24 mục giờ và 7 mục ngày.
- Mỗi mục hiển thị đủ các trường bắt buộc của đề bài.
- Người dùng xem được chi tiết giờ hoặc ngày.
- Tám nhóm chỉ số thời tiết được trình bày rõ ràng khi dữ liệu tồn tại.
- Loading, error, empty và refresh đều có giao diện riêng.
- Từ chối vị trí không làm ứng dụng crash.
- Test, lint, typecheck và Android build hoàn tất thành công.

