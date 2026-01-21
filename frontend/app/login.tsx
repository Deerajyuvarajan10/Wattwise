/**
 * Login Screen - Simple Email/Password Authentication
 */
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { Zap, Mail, Lock, ArrowRight } from 'lucide-react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { setUser } = useStore();
    const [loading, setLoading] = useState(false);

    // Email/Password State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);

    const handleEmailAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);

        // Simple authentication - in demo mode, any email/pass works
        // In production, you would integrate with your backend auth API
        setTimeout(() => {
            setUser({
                uid: email, // Use email as ID for simplicity
                email: email,
                displayName: email.split('@')[0]
            });
            setLoading(false);
            router.replace('/(tabs)');
        }, 500);
    };

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.container}>
                        {/* Logo */}
                        <View style={styles.logoContainer}>
                            <View style={styles.logoGlow} />
                            <Zap size={64} color={Colors.primary} />
                        </View>

                        <Text style={styles.title}>WattWise</Text>
                        <Text style={styles.subtitle}>Smart Electricity Monitor</Text>

                        {/* Auth Form */}
                        <View style={styles.formContainer}>
                            <Text style={styles.formTitle}>{isSignUp ? 'Create Account' : 'Welcome Back'}</Text>

                            <View style={styles.inputContainer}>
                                <Mail size={20} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Email"
                                    placeholderTextColor={Colors.textMuted}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Lock size={20} color={Colors.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Password"
                                    placeholderTextColor={Colors.textMuted}
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry
                                />
                            </View>

                            <TouchableOpacity
                                style={[styles.authButton, loading && styles.authButtonDisabled]}
                                onPress={handleEmailAuth}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#000" />
                                ) : (
                                    <>
                                        <Text style={styles.authButtonText}>
                                            {isSignUp ? 'Sign Up' : 'Sign In'}
                                        </Text>
                                        <ArrowRight size={20} color="#000" />
                                    </>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.toggleButton}
                                onPress={() => setIsSignUp(!isSignUp)}
                            >
                                <Text style={styles.toggleText}>
                                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Footer */}
                        <Text style={styles.footer}>
                            By signing in, you agree to our Terms of Service
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.xl,
        paddingTop: Spacing.xxl,
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
        marginBottom: Spacing.xl,
    },
    formContainer: {
        width: '100%',
        marginTop: Spacing.lg,
    },
    formTitle: {
        ...Typography.h2,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        marginBottom: Spacing.md,
        paddingHorizontal: Spacing.md,
        height: 56,
    },
    inputIcon: {
        marginRight: Spacing.md,
    },
    input: {
        flex: 1,
        color: Colors.textPrimary,
        fontSize: 16,
        height: '100%',
    },
    authButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: Spacing.sm,
        gap: 8,
    },
    authButtonDisabled: {
        opacity: 0.7,
    },
    authButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '700',
    },
    toggleButton: {
        marginTop: Spacing.md,
        alignItems: 'center',
    },
    toggleText: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: Spacing.xl,
        gap: Spacing.md,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    dividerText: {
        color: Colors.textMuted,
        fontSize: 14,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        gap: 12,
    },
    googleIcon: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4285f4',
    },
    buttonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: Spacing.xl * 2,
        textAlign: 'center',
    },
});
