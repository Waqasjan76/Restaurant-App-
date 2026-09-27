import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrdersContext';
import { FINAL_STATUSES } from '../reducers/ordersReducer';
import MenuScreen from '../screens/MenuScreen';
import CartScreen from '../screens/CartScreen';
import OrderSummaryScreen from '../screens/OrderSummaryScreen';
import MyOrdersScreen from '../screens/MyOrdersScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import ReservationScreen from '../screens/ReservationScreen';
import MyReservationsScreen from '../screens/MyReservationsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ManagerDashboardScreen from '../screens/ManagerDashboardScreen';

// Bottom tabs, each hosting its own native stack (nested navigation).
const Tab = createBottomTabNavigator();
const MenuStack = createNativeStackNavigator();
const CartStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const ReserveStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const DashboardStack = createNativeStackNavigator();

const TAB_ICONS = {
  DashboardTab: 'speedometer',
  MenuTab: 'restaurant',
  CartTab: 'cart',
  OrdersTab: 'receipt',
  ReserveTab: 'calendar',
  ProfileTab: 'person-circle',
};

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

function OrdersStackScreen() {
  return (
    <OrdersStack.Navigator>
      <OrdersStack.Screen name="MyOrders" component={MyOrdersScreen} options={{ title: 'My Orders' }} />
      <OrdersStack.Screen name="OrderTracking" component={OrderTrackingScreen} options={{ title: 'Order Tracking' }} />
    </OrdersStack.Navigator>
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
      <DashboardStack.Screen name="Dashboard" component={ManagerDashboardScreen} options={{ title: 'Manager Dashboard' }} />
    </DashboardStack.Navigator>
  );
}

export default function MainTabs() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { itemCount } = useCart();
  const { orders } = useOrders();
  const isManager = user?.role === 'manager';

  const activeOrders = orders.filter(
    (o) => !FINAL_STATUSES.includes(o.status) && (isManager || o.userId === user?.id)
  ).length;

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
        <Tab.Screen
          name="DashboardTab"
          component={DashboardStackScreen}
          options={{ title: 'Dashboard', tabBarBadge: activeOrders > 0 ? activeOrders : undefined }}
        />
      )}
      <Tab.Screen name="MenuTab" component={MenuStackScreen} options={{ title: 'Menu' }} />
      {!isManager && (
        <>
          <Tab.Screen
            name="CartTab"
            component={CartStackScreen}
            options={{ title: 'Cart', tabBarBadge: itemCount > 0 ? itemCount : undefined }}
          />
          <Tab.Screen
            name="OrdersTab"
            component={OrdersStackScreen}
            options={{ title: 'Orders', tabBarBadge: activeOrders > 0 ? activeOrders : undefined }}
          />
          <Tab.Screen name="ReserveTab" component={ReserveStackScreen} options={{ title: 'Reserve' }} />
        </>
      )}
      <Tab.Screen name="ProfileTab" component={ProfileStackScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}
