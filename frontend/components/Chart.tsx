/**
 * Simple Chart Components for WattWise
 * Pure React Native implementation with animated bars and lines
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DataPoint {
    label: string;
    value: number;
}

interface BarChartProps {
    data: DataPoint[];
    height?: number;
    showLabels?: boolean;
    barColor?: string;
    highlightMax?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
    data,
    height = 150,
    showLabels = true,
    barColor = Colors.primary,
    highlightMax = true,
}) => {
    // Create animations array that updates when data length changes
    const animations = useRef<Animated.Value[]>([]).current;

    // Update animations array when data length changes
    useEffect(() => {
        // Ensure we have the right number of animations
        while (animations.length < data.length) {
            animations.push(new Animated.Value(0));
        }
        while (animations.length > data.length) {
            animations.pop();
        }
    }, [data.length]);

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const maxIndex = data.findIndex(d => d.value === maxValue);

    useEffect(() => {
        if (animations.length === data.length) {
            const animationSequence = animations.map((anim, index) =>
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 500,
                    delay: index * 50,
                    useNativeDriver: false,
                })
            );
            Animated.stagger(50, animationSequence).start();
        }
    }, [data]);

    const barWidth = (SCREEN_WIDTH - Spacing.md * 4) / data.length - 8;

    return (
        <View style={[styles.chartContainer, { height }]}>
            <View style={styles.barsContainer}>
                {data.map((item, index) => {
                    // Safety check: ensure animation exists before using it
                    if (!animations[index]) {
                        return null;
                    }

                    const barHeight = animations[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (item.value / maxValue) * (height - 40)],
                    });

                    const isMax = highlightMax && index === maxIndex;

                    return (
                        <View key={index} style={styles.barWrapper}>
                            <View style={[styles.barBackground, { height: height - 40 }]}>
                                <Animated.View
                                    style={[
                                        styles.bar,
                                        {
                                            height: barHeight,
                                            width: barWidth,
                                            backgroundColor: isMax ? Colors.warning : barColor,
                                        },
                                    ]}
                                />
                            </View>
                            {showLabels && (
                                <Text style={styles.barLabel} numberOfLines={1}>
                                    {item.label}
                                </Text>
                            )}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

interface LineChartProps {
    data: DataPoint[];
    height?: number;
    lineColor?: string;
    showDots?: boolean;
    showArea?: boolean;
}

export const MiniLineChart: React.FC<LineChartProps> = ({
    data,
    height = 60,
    lineColor = Colors.primary,
    showDots = true,
}) => {
    if (data.length < 2) return null;

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const minValue = Math.min(...data.map(d => d.value), 0);
    const range = maxValue - minValue || 1;

    const width = SCREEN_WIDTH - Spacing.md * 4;
    const stepX = width / (data.length - 1);

    const points = data.map((d, i) => ({
        x: i * stepX,
        y: height - ((d.value - minValue) / range) * height,
    }));

    return (
        <View style={[styles.lineChartContainer, { height }]}>
            {/* Lines */}
            {points.slice(0, -1).map((point, i) => {
                const nextPoint = points[i + 1];
                const dx = nextPoint.x - point.x;
                const dy = nextPoint.y - point.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                return (
                    <View
                        key={i}
                        style={[
                            styles.line,
                            {
                                width: length,
                                left: point.x,
                                top: point.y,
                                transform: [{ rotate: `${angle}deg` }],
                                backgroundColor: lineColor,
                            },
                        ]}
                    />
                );
            })}

            {/* Dots */}
            {showDots && points.map((point, i) => (
                <View
                    key={`dot-${i}`}
                    style={[
                        styles.dot,
                        {
                            left: point.x - 4,
                            top: point.y - 4,
                            backgroundColor: lineColor,
                        },
                    ]}
                />
            ))}
        </View>
    );
};

interface ProgressRingProps {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
    progress,
    size = 80,
    strokeWidth = 8,
    color = Colors.primary,
    label,
}) => {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: progress,
            duration: 1000,
            useNativeDriver: false,
        }).start();
    }, [progress]);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    return (
        <View style={[styles.ringContainer, { width: size, height: size }]}>
            {/* Background circle */}
            <View
                style={[
                    styles.ringBackground,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                        borderWidth: strokeWidth,
                    },
                ]}
            />
            {/* Progress arc - simplified with quarter segments */}
            <View style={styles.ringProgress}>
                <View
                    style={[
                        styles.progressSegment,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                            borderWidth: strokeWidth,
                            borderColor: color,
                            borderRightColor: 'transparent',
                            borderBottomColor: progress > 25 ? color : 'transparent',
                            borderLeftColor: progress > 50 ? color : 'transparent',
                            borderTopColor: progress > 75 ? color : 'transparent',
                        },
                    ]}
                />
            </View>
            {/* Center label */}
            <View style={styles.ringCenter}>
                <Text style={styles.ringValue}>{Math.round(progress)}%</Text>
                {label && <Text style={styles.ringLabel}>{label}</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    chartContainer: {
        width: '100%',
        marginVertical: Spacing.sm,
    },
    barsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        flex: 1,
        paddingHorizontal: 4,
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    barBackground: {
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    bar: {
        borderRadius: 4,
        minHeight: 4,
    },
    barLabel: {
        color: Colors.textMuted,
        fontSize: 10,
        marginTop: 4,
        textAlign: 'center',
    },
    lineChartContainer: {
        width: '100%',
        position: 'relative',
        marginVertical: Spacing.sm,
    },
    line: {
        position: 'absolute',
        height: 2,
        transformOrigin: 'left center',
    },
    dot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    ringContainer: {
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ringBackground: {
        position: 'absolute',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    ringProgress: {
        position: 'absolute',
    },
    progressSegment: {
        transform: [{ rotate: '-45deg' }],
    },
    ringCenter: {
        alignItems: 'center',
    },
    ringValue: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    ringLabel: {
        color: Colors.textMuted,
        fontSize: 10,
    },
});
