
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Spacing, Typography } from '../constants/Theme';

interface NeonButtonProps {
    title: string;
    onPress: () => void;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
    style?: any;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
    title,
    onPress,
    loading = false,
    variant = 'primary',
    style
}) => {

    let colors = Gradients.primaryMap;
    let textColor = Colors.background;

    if (variant === 'secondary') {
        colors = [Colors.cardBg, Colors.cardBg]; // Solid-ish
        textColor = Colors.textPrimary;
    } else if (variant === 'danger') {
        colors = Gradients.alertMap;
        textColor = '#fff';
    }

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onPress}
            disabled={loading}
            style={[styles.wrapper, style]}
        >
            <LinearGradient
                colors={colors as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color={textColor} />
                ) : (
                    <Text style={[styles.text, { color: textColor }]}>{title}</Text>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        borderRadius: 12,
        overflow: 'hidden',
        marginVertical: Spacing.xs,
        elevation: 5,
        shadowColor: Colors.primary,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    gradient: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
