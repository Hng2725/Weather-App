const forecastStart = 1759942800;

export const currentWeatherFixture = {
  coord: {lon: 106.7, lat: 10.77},
  weather: [{id: 500, main: 'Rain', description: 'mưa nhẹ', icon: '10d'}],
  base: 'stations',
  main: {
    temp: 29.6,
    feels_like: 33.2,
    temp_min: 28,
    temp_max: 32,
    pressure: 1008,
    humidity: 78,
  },
  visibility: 10000,
  wind: {speed: 3.5, deg: 135},
  rain: {'1h': 1.2},
  clouds: {all: 90},
  dt: forecastStart,
  sys: {country: 'VN', sunrise: 1759960000, sunset: 1760004000},
  timezone: 7 * 60 * 60,
  id: 1566083,
  name: 'Ho Chi Minh City',
  cod: 200,
};

export const forecastFixture = {
  cod: '200',
  message: 0,
  cnt: 40,
  list: Array.from({length: 40}, (_, index) => {
    const period = index % 8;
    return {
      dt: forecastStart + index * 3 * 60 * 60,
      main: {
        temp: 24 + period,
        feels_like: 25 + period,
        temp_min: 24 + period,
        temp_max: 24 + period,
        pressure: 1008,
        sea_level: 1008,
        grnd_level: 1007,
        humidity: 78,
      },
      weather: [{
        id: 500,
        main: 'Rain',
        description: period === 4 ? 'mưa vừa' : 'mưa nhẹ',
        icon: period >= 2 && period <= 6 ? '10d' : '10n',
      }],
      clouds: {all: 90},
      wind: {speed: 3.5, deg: 135, gust: 5.2},
      visibility: 10000,
      pop: (period + 1) / 10,
      rain: {'3h': 0.4},
      sys: {pod: period >= 2 && period <= 6 ? 'd' : 'n'},
      dt_txt: new Date((forecastStart + index * 3 * 60 * 60) * 1000)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19),
    };
  }),
  city: {
    id: 1566083,
    name: 'Ho Chi Minh City',
    coord: {lat: 10.77, lon: 106.7},
    country: 'VN',
    population: 8993082,
    timezone: 7 * 60 * 60,
    sunrise: 1759960000,
    sunset: 1760004000,
  },
};
