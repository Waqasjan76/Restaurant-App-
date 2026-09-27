import React from 'react';
import { Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';

const Stack = createNativeStackNavigator();

// Temporary landing screens until the real Menu and Dashboard are built.
function Placeholder({ route }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18 }}>Logged in as {route.params?.user?.fullName}</Text>
      <Text>{route.name} screen coming soon</Text>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Menu" component={Placeholder} />
        <Stack.Screen name="Dashboard" component={Placeholder} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
