/**
 * App Entry Point
 * Redirects to login or tabs based on auth state
 */
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { auth } from '../firebaseConfig';
import { useStore } from '../store/useStore';
import { Colors } from '../constants/Theme';
import { ScreenWrapper } from '../components/ScreenWrapper';

export default function Index() {
    const { setUser, user } = useStore();
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check Firebase auth state
        const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Show loading while checking auth
    if (loading) {
        return (
            <ScreenWrapper>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    // Redirect based on auth state
    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    } else {
        return <Redirect href="/login" />;
    }
}
