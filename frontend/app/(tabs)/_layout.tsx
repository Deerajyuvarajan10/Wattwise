import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Theme';
import {
    LayoutDashboard,
    Zap,
    Bell,
    BarChart3,
    Settings
} from 'lucide-react-native';

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textMuted,
                tabBarStyle: {
                    backgroundColor: Colors.background,
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.1)',
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 65,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused && styles.activeIcon}>
                            <LayoutDashboard size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="appliances"
                options={{
                    title: 'Appliances',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused && styles.activeIcon}>
                            <Zap size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="reports"
                options={{
                    title: 'Reports',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused && styles.activeIcon}>
                            <BarChart3 size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="alerts"
                options={{
                    title: 'Alerts',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused && styles.activeIcon}>
                            <Bell size={22} color={color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={focused && styles.activeIcon}>
                            <Settings size={22} color={color} />
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    activeIcon: {
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        borderRadius: 10,
        padding: 6,
    },
});
