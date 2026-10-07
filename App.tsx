import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import type {RootStackParamList} from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import WeatherDetailScreen from './src/screens/WeatherDetailScreen';
import {colors} from './src/theme/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const App = () => (
  <SafeAreaProvider>
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          animation: 'slide_from_right',
          headerStyle: {backgroundColor: colors.backgroundDark},
          headerTintColor: colors.textOnDark,
          headerTitleStyle: {fontWeight: '700'},
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="WeatherDetail"
          component={WeatherDetailScreen}
          options={{title: 'Chi tiết thời tiết'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  </SafeAreaProvider>
);

export default App;
