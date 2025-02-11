import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';

const Drawer = createDrawerNavigator();

function Navigation() {
    return (
        <Drawer.Navigator
            initialRouteName="Home"
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#1F2937', // bg-gray-800
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Drawer.Screen name="Home" component={HomeScreen} />
            <Drawer.Screen name="Movies" component={MoviesScreen} />
            <Drawer.Screen name="Series" component={SeriesScreen} />
            <Drawer.Screen name="Categories" component={CategoriesScreen} />
            <Drawer.Screen name="Admin" component={AdminDashboard} />
        </Drawer.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1F2937',
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    logo: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    link: {
        color: '#D1D5DB',
        fontSize: 14,
        marginVertical: 8,
    },
    button: {
        backgroundColor: '#DC2626',
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default Navigation; 