
import React from 'react';
import { View, StyleSheet, Text, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Spacing } from '../constants/Theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    highlight?: boolean; // If true, adds a subtle glow border
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, intensity = 20, highlight = false }) => {
    return (
        <View style={[styles.container, highlight && styles.highlightBorder, style]}>
            <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={Gradients.cardMap as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        backgroundColor: 'rgba(20, 30, 48, 0.3)', // Fallback
        marginBottom: Spacing.md,
    },
    highlightBorder: {
        borderColor: Colors.primary,
        borderWidth: 1,
    },
    content: {
        padding: Spacing.md,
    },
});
