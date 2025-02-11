import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import AdminDashboard from '../components/mobile/AdminDashboard';

const Tab = createBottomTabNavigator();

function BottomTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: '#1F2937',
                    borderTopColor: '#374151',
                },
                tabBarActiveTintColor: '#DC2626',
                tabBarInactiveTintColor: '#9CA3AF',
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Feather name="home" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Admin"
                component={AdminDashboard}
                options={{
                    tabBarIcon: ({ color }) => (
                        <Feather name="settings" size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default BottomTabs; 