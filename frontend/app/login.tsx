/**
 * Login Screen - Google Sign-In with Firebase
 * Works with Expo Development Build (not Expo Go)
 */
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from '../firebaseConfig';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Zap } from 'lucide-react-native';

// Configure Google Sign-In
GoogleSignin.configure({
    webClientId: "1027569019680-0e74806c119e2782f40545.apps.googleusercontent.com", // From Firebase Console
});

export default function LoginScreen() {
    const router = useRouter();
    const { setUser } = useStore();
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    useEffect(() => {
        // Check if already logged in
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setCheckingAuth(false);
            if (user) {
                setUser(user);
                router.replace('/(tabs)');
            }
        });
        return unsubscribe;
    }, []);

    const onGoogleButtonPress = async () => {
        setLoading(true);
        try {
            // Check Play Services
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Sign in with Google
            const signInResult = await GoogleSignin.signIn();

            // Get ID token
            let idToken = (signInResult as any).data?.idToken || (signInResult as any).idToken;

            if (!idToken) {
                throw new Error('No ID token received from Google');
            }

            // Create Firebase credential
            const googleCredential = GoogleAuthProvider.credential(idToken);

            // Sign in to Firebase
            const userCredential = await signInWithCredential(auth, googleCredential);

            // User will be set by onAuthStateChanged listener
            console.log('Login successful:', userCredential.user.email);
        } catch (error: any) {
            console.error('Login error:', error);

            // Handle specific errors
            if (error.code === 'SIGN_IN_CANCELLED') {
                // User cancelled, don't show alert
            } else if (error.code === 'IN_PROGRESS') {
                Alert.alert('Please wait', 'Sign in is already in progress');
            } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
                Alert.alert('Error', 'Google Play Services is not available');
            } else {
                Alert.alert('Login Failed', error.message || 'An error occurred');
            }
            setLoading(false);
        }
    };

    if (checkingAuth) {
        return (
            <ScreenWrapper>
                <View style={styles.container}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                {/* Logo */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoGlow} />
                    <Zap size={64} color={Colors.primary} />
                </View>

                <Text style={styles.title}>WattWise</Text>
                <Text style={styles.subtitle}>Smart Electricity Monitor</Text>
                <Text style={styles.tagline}>Track • Analyze • Save</Text>

                {/* Features */}
                <View style={styles.features}>
                    <Text style={styles.featureItem}>⚡ Track daily energy usage</Text>
                    <Text style={styles.featureItem}>📊 Smart anomaly detection</Text>
                    <Text style={styles.featureItem}>💰 Bill predictions & savings tips</Text>
                </View>

                {/* Sign In Button */}
                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={onGoogleButtonPress}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <>
                            <Text style={styles.googleIcon}>G</Text>
                            <Text style={styles.buttonText}>Sign in with Google</Text>
                        </>
                    )}
                </TouchableOpacity>

                {/* Footer */}
                <Text style={styles.footer}>
                    By signing in, you agree to our Terms of Service
                </Text>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    logoContainer: {
        position: 'relative',
        marginBottom: Spacing.lg,
    },
    logoGlow: {
        position: 'absolute',
        top: -30,
        left: -30,
        right: -30,
        bottom: -30,
        backgroundColor: Colors.primary,
        opacity: 0.15,
        borderRadius: 100,
    },
    title: {
        fontSize: 48,
        fontWeight: '800',
        color: Colors.primary,
        textShadowColor: Colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 25,
        letterSpacing: -1,
    },
    subtitle: {
        ...Typography.body,
        fontSize: 18,
        marginTop: Spacing.xs,
    },
    tagline: {
        color: Colors.textMuted,
        fontSize: 14,
        marginTop: Spacing.xs,
        letterSpacing: 2,
    },
    features: {
        marginTop: Spacing.xl,
        marginBottom: Spacing.xl,
        alignItems: 'flex-start',
    },
    featureItem: {
        color: Colors.textSecondary,
        fontSize: 15,
        marginVertical: 6,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        width: '100%',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        gap: 12,
    },
    googleIcon: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4285f4',
    },
    buttonText: {
        color: '#333',
        fontSize: 17,
        fontWeight: '600',
    },
    footer: {
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: Spacing.xl,
        textAlign: 'center',
    },
});
