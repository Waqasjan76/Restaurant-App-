import React from 'react';
import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import MenuScreen from '../screens/MenuScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CartScreen from '../screens/CartScreen';
import OrderSummaryScreen from '../screens/OrderSummaryScreen';
import ReservationScreen from '../screens/ReservationScreen';
import MyReservationsScreen from '../screens/MyReservationsScreen';

const Tab = createBottomTabNavigator();
const MenuStack = createNativeStackNavigator();
const CartStack = createNativeStackNavigator();
const ReserveStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();

const TAB_ICONS = {
  DashboardTab: 'speedometer',
  MenuTab: 'restaurant',
  CartTab: 'cart',
  ReserveTab: 'calendar',
  ProfileTab: 'person-circle',
};

function DashboardPlaceholder() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <Text style={{ color: colors.text, fontSize: 18 }}>Manager Dashboard coming soon</Text>
    </View>
  );
}

function MenuStackScreen() {
  return (
    <MenuStack.Navigator>
      <MenuStack.Screen name="Menu" component={MenuScreen} />
    </MenuStack.Navigator>
  );
}

function CartStackScreen() {
  return (
    <CartStack.Navigator>
      <CartStack.Screen name="Cart" component={CartScreen} options={{ title: 'Your Cart' }} />
      <CartStack.Screen name="OrderSummary" component={OrderSummaryScreen} options={{ title: 'Order Summary' }} />
    </CartStack.Navigator>
  );
}

function ReserveStackScreen() {
  return (
    <ReserveStack.Navigator>
      <ReserveStack.Screen name="Reservation" component={ReservationScreen} options={{ title: 'Book a Table' }} />
      <ReserveStack.Screen name="MyReservations" component={MyReservationsScreen} options={{ title: 'My Reservations' }} />
    </ReserveStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator>
      <DashboardStack.Screen name="Dashboard" component={DashboardPlaceholder} />
    </DashboardStack.Navigator>
  );
}

export default function MainTabs() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { itemCount } = useCart();
  const isManager = user?.role === 'manager';

  return (
    <Tab.Navigator
      initialRouteName={isManager ? 'DashboardTab' : 'MenuTab'}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? TAB_ICONS[route.name] : `${TAB_ICONS[route.name]}-outline`}
            size={size}
            color={color}
          />
        ),
      })}
    >
      {/* Role based navigation: only managers get the Dashboard tab. */}
      {isManager && (
        <Tab.Screen name="DashboardTab" component={DashboardStackScreen} options={{ title: 'Dashboard' }} />
      )}
      <Tab.Screen name="MenuTab" component={MenuStackScreen} options={{ title: 'Menu' }} />
      {!isManager && (
        <Tab.Screen
          name="CartTab"
          component={CartStackScreen}
          options={{ title: 'Cart', tabBarBadge: itemCount > 0 ? itemCount : undefined }}
        />
      )}
      {!isManager && (
        <Tab.Screen name="ReserveTab" component={ReserveStackScreen} options={{ title: 'Reserve' }} />
      )}
      <Tab.Screen name="ProfileTab" component={ProfileStackScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
