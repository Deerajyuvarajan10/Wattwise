/**
 * Animated Stat Card Component
 * Displays metrics with animated counter and trend indicator
 */
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { GlassCard } from './GlassCard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

interface StatCardProps {
    title: string;
    value: number;
    unit?: string;
    prefix?: string;
    trend?: number; // Percentage change
    icon?: React.ReactNode;
    color?: string;
    compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    unit = '',
    prefix = '',
    trend,
    icon,
    color = Colors.primary,
    compact = false,
}) => {
    const [displayValue, setDisplayValue] = useState(0);
    const animatedValue = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animate counter
        animatedValue.setValue(0);
        Animated.timing(animatedValue, {
            toValue: value,
            duration: 1000,
            useNativeDriver: false,
        }).start();

        // Update display value
        const listener = animatedValue.addListener(({ value: v }) => {
            setDisplayValue(Math.round(v * 100) / 100);
        });

        // Glow pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: false,
                }),
                Animated.timing(glowAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: false,
                }),
            ])
        ).start();

        return () => {
            animatedValue.removeListener(listener);
        };
    }, [value]);

    const getTrendIcon = () => {
        if (!trend || trend === 0) {
            return <Minus size={14} color={Colors.textMuted} />;
        }
        if (trend > 0) {
            return <TrendingUp size={14} color={Colors.danger} />;
        }
        return <TrendingDown size={14} color={Colors.success} />;
    };

    const getTrendColor = () => {
        if (!trend || trend === 0) return Colors.textMuted;
        return trend > 0 ? Colors.danger : Colors.success;
    };

    const formatValue = (val: number) => {
        if (val >= 1000) {
            return (val / 1000).toFixed(1) + 'k';
        }
        return val.toFixed(val % 1 === 0 ? 0 : 2);
    };

    const glowOpacity = glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.6],
    });

    if (compact) {
        return (
            <View style={styles.compactContainer}>
                {icon && (
                    <View style={[styles.compactIcon, { backgroundColor: `${color}20` }]}>
                        {icon}
                    </View>
                )}
                <View style={styles.compactContent}>
                    <Text style={styles.compactTitle}>{title}</Text>
                    <Text style={[styles.compactValue, { color }]}>
                        {prefix}{formatValue(displayValue)}{unit}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <GlassCard style={styles.card}>
            <Animated.View
                style={[
                    styles.glowEffect,
                    {
                        opacity: glowOpacity,
                        backgroundColor: color,
                    },
                ]}
            />
            <View style={styles.header}>
                {icon && (
                    <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                        {icon}
                    </View>
                )}
                <Text style={styles.title}>{title}</Text>
            </View>

            <View style={styles.valueContainer}>
                <Text style={[styles.value, { color }]}>
                    {prefix}{formatValue(displayValue)}
                </Text>
                {unit && <Text style={styles.unit}>{unit}</Text>}
            </View>

            {trend !== undefined && (
                <View style={styles.trendContainer}>
                    {getTrendIcon()}
                    <Text style={[styles.trendText, { color: getTrendColor() }]}>
                        {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                    </Text>
                    <Text style={styles.trendLabel}>vs last week</Text>
                </View>
            )}
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    card: {
        padding: Spacing.md,
        overflow: 'hidden',
    },
    glowEffect: {
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: 40,
        opacity: 0.3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    title: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    value: {
        fontSize: 32,
        fontWeight: '700',
    },
    unit: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
        gap: 4,
    },
    trendText: {
        fontSize: 13,
        fontWeight: '600',
    },
    trendLabel: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    // Compact styles
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: Spacing.sm,
        flex: 1,
    },
    compactIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    compactContent: {
        flex: 1,
    },
    compactTitle: {
        color: Colors.textMuted,
        fontSize: 11,
    },
    compactValue: {
        fontSize: 16,
        fontWeight: '700',
    },
});
