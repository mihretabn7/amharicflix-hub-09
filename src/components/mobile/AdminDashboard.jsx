import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Animated, RefreshControl } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { LineChart, BarChart } from 'react-native-chart-kit';
import Icon from 'react-native-vector-icons/Feather';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedGestureHandler,
    useAnimatedStyle,
    withSpring,
    useSharedValue,
} from 'react-native-reanimated';

const Drawer = createDrawerNavigator();

function StatCard({ title, value, change, icon, isNegative, onPress }) {
    const scale = useSharedValue(1);

    const gestureHandler = useAnimatedGestureHandler({
        onStart: () => {
            scale.value = withSpring(0.95);
        },
        onEnd: () => {
            scale.value = withSpring(1);
        },
    });

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    return (
        <PanGestureHandler onGestureEvent={gestureHandler}>
            <Animated.View style={[styles.card, animatedStyle]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Icon name={icon} size={20} color="#9CA3AF" />
                </View>
                <View>
                    <Text style={styles.cardValue}>{value}</Text>
                    <Text style={[
                        styles.cardChange,
                        { color: isNegative ? '#EF4444' : '#10B981' }
                    ]}>
                        {change}
                    </Text>
                </View>
            </Animated.View>
        </PanGestureHandler>
    );
}

function DashboardScreen({ stats }) {
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        // Simulate data refresh
        setTimeout(() => {
            setRefreshing(false);
        }, 2000);
    }, []);

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#3B82F6']}
                />
            }
        >
            <View style={styles.statsContainer}>
                {stats.map((stat, index) => (
                    <Animated.View
                        key={index}
                        style={[
                            styles.card,
                            {
                                transform: [{ translateY }],
                                opacity,
                            },
                        ]}
                    >
                        <StatCard {...stat} />
                    </Animated.View>
                ))}
            </View>

            {/* Charts Section */}
            <View style={styles.chartsContainer}>
                <LineChart
                    data={{
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            data: [20, 45, 28, 80, 99, 43]
                        }]
                    }}
                    width={350}
                    height={220}
                    chartConfig={{
                        backgroundColor: '#ffffff',
                        backgroundGradientFrom: '#ffffff',
                        backgroundGradientTo: '#ffffff',
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    style={styles.chart}
                />
            </View>
        </ScrollView>
    );
}

function AdminDashboard() {
    const [activeSection, setActiveSection] = useState('dashboard');

    const renderStatCard = ({ title, value, change, icon, isNegative }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Icon name={icon} size={20} color="#9CA3AF" />
            </View>
            <View>
                <Text style={styles.cardValue}>{value}</Text>
                <Text style={[
                    styles.cardChange,
                    { color: isNegative ? '#EF4444' : '#10B981' }
                ]}>
                    {change}
                </Text>
            </View>
        </View>
    );

    return (
        <Drawer.Navigator
            initialRouteName="Dashboard"
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#fff',
                },
                headerTintColor: '#000',
            }}
        >
            <Drawer.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    drawerIcon: ({ color }) => (
                        <Icon name="home" size={20} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Sales"
                component={SalesScreen}
                options={{
                    drawerIcon: ({ color }) => (
                        <Icon name="dollar-sign" size={20} color={color} />
                    ),
                }}
            />
            {/* Add other screens */}
        </Drawer.Navigator>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F3F4F6',
    },
    statsContainer: {
        padding: 16,
    },
    chartsContainer: {
        padding: 16,
        alignItems: 'center',
    },
    chart: {
        marginVertical: 8,
        borderRadius: 16,
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    cardValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    cardChange: {
        fontSize: 14,
    },
});

export default AdminDashboard; 