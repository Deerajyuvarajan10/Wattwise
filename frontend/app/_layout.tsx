import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/Theme';
import { ThemeProvider } from '../contexts/ThemeContext';

export default function RootLayout() {
    return (
        <ThemeProvider>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerStyle: {
                        backgroundColor: Colors.background,
                    },
                    headerTintColor: Colors.textPrimary,
                    headerTitleStyle: {
                        fontWeight: 'bold',
                        color: Colors.textPrimary,
                    },
                    headerShadowVisible: false,
                    contentStyle: { backgroundColor: Colors.background },
                }}
            >
                <Stack.Screen name="index" options={{ title: 'Dashboard', headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="add-reading" options={{ title: 'Add Reading', presentation: 'modal', headerShown: false }} />
                <Stack.Screen name="readings-history" options={{ title: 'Readings History', headerShown: true }} />
                <Stack.Screen name="import-bill" options={{ title: 'Import Last Bill', headerShown: true }} />
            </Stack>
        </ThemeProvider>
    );
}
