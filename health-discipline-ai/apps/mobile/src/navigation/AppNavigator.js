import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

import DashboardScreen from '../screens/DashboardScreen';
import PatientsScreen from '../screens/PatientsScreen';
import PatientDetailScreen from '../screens/PatientDetailScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { HomeIcon, UsersIcon, ChartIcon, SettingsIcon } from '../components/Icons';

const Tab = createBottomTabNavigator();
const PatientsStack = createNativeStackNavigator();

function PatientsStackScreen() {
  return (
    <PatientsStack.Navigator screenOptions={{ headerShown: false }}>
      <PatientsStack.Screen name="PatientsList" component={PatientsScreen} />
      <PatientsStack.Screen name="PatientDetail" component={PatientDetailScreen} />
    </PatientsStack.Navigator>
  );
}

const DashboardStack = createNativeStackNavigator();

function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardHome" component={DashboardScreen} />
      <DashboardStack.Screen name="PatientDetailFromHome" component={PatientDetailScreen} />
    </DashboardStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.moss800,
        tabBarInactiveTintColor: colors.sand400,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ color, focused }) => {
          const size = 22;
          const bg = focused ? colors.moss100 : 'transparent';
          return (
            <View style={[styles.iconWrap, { backgroundColor: bg }]}>
              {route.name === 'Home' && <HomeIcon size={size} color={color} />}
              {route.name === 'Patients' && <UsersIcon size={size} color={color} />}
              {route.name === 'Reports' && <ChartIcon size={size} color={color} />}
              {route.name === 'Settings' && <SettingsIcon size={size} color={color} />}
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={DashboardStackScreen} />
      <Tab.Screen name="Patients" component={PatientsStackScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopColor: colors.sand200,
    borderTopWidth: 1,
    height: 65,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  iconWrap: {
    width: 38,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
