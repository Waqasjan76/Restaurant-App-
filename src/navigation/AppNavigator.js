import React, { useMemo } from 'react';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useMenu } from '../context/MenuContext';
import { useOrders } from '../context/OrdersContext';
import { useReservations } from '../context/ReservationsContext';
import LoginScreen from '../screens/LoginScreen';
import LoadingScreen from '../screens/LoadingScreen';
import MainTabs from './MainTabs';
import { navigationRef } from './navigationRef';

const RootStack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isDark, colors, isHydrated: themeReady } = useTheme();
  const { isHydrated: accountsReady } = useAuth();
  const { isHydrated: menuReady } = useMenu();
  const { isHydrated: ordersReady } = useOrders();
  const { isHydrated: reservationsReady } = useReservations();

  // Feed our palette into React Navigation so headers and the tab bar follow it.
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.card,
        text: colors.text,
        border: colors.border,
        notification: colors.primary,
      },
    };
  }, [isDark, colors]);

  // Wait until everything saved in AsyncStorage has been loaded.
  if (!(themeReady && accountsReady && menuReady && ordersReady && reservationsReady)) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Main" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
