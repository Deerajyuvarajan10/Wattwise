/**
 * Skeleton Loader Components
 * Shimmer animation for loading states
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Colors, Spacing } from '../constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: object;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = 8,
    style,
}) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
        <View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.1)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};

export const CardSkeleton: React.FC = () => (
    <View style={styles.cardSkeleton}>
        <View style={styles.cardHeader}>
            <Skeleton width={48} height={48} borderRadius={12} />
            <View style={styles.cardHeaderText}>
                <Skeleton width={100} height={14} />
                <Skeleton width={60} height={12} style={{ marginTop: 6 }} />
            </View>
        </View>
        <Skeleton height={40} style={{ marginTop: 12 }} />
        <Skeleton width="60%" height={14} style={{ marginTop: 8 }} />
    </View>
);

export const ListItemSkeleton: React.FC = () => (
    <View style={styles.listItemSkeleton}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.listItemContent}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="40%" height={12} style={{ marginTop: 6 }} />
        </View>
        <Skeleton width={60} height={20} borderRadius={10} />
    </View>
);

export const DashboardSkeleton: React.FC = () => (
    <View style={styles.dashboardSkeleton}>
        {/* Header */}
        <View style={styles.headerSkeleton}>
            <Skeleton width={150} height={24} />
            <Skeleton width={80} height={28} borderRadius={14} />
        </View>

        {/* Main card */}
        <CardSkeleton />

        {/* Quick stats */}
        <View style={styles.quickStats}>
            <Skeleton height={70} style={{ flex: 1 }} />
            <Skeleton height={70} style={{ flex: 1, marginLeft: 12 }} />
        </View>

        {/* Section title */}
        <Skeleton width={120} height={18} style={{ marginTop: 20 }} />

        {/* List items */}
        <ListItemSkeleton />
        <ListItemSkeleton />
        <ListItemSkeleton />
    </View>
);

export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 150 }) => (
    <View style={[styles.chartSkeleton, { height }]}>
        <View style={styles.chartBars}>
            {[0.6, 0.8, 0.4, 0.9, 0.5, 0.7, 0.3].map((h, i) => (
                <Skeleton
                    key={i}
                    width={24}
                    height={height * h}
                    borderRadius={4}
                />
            ))}
        </View>
    </View>
);

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    shimmer: {
        ...StyleSheet.absoluteFillObject,
        width: SCREEN_WIDTH,
    },
    cardSkeleton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardHeaderText: {
        flex: 1,
        marginLeft: Spacing.sm,
    },
    listItemSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    listItemContent: {
        flex: 1,
        marginLeft: Spacing.sm,
    },
    dashboardSkeleton: {
        padding: Spacing.md,
    },
    headerSkeleton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    quickStats: {
        flexDirection: 'row',
        marginTop: Spacing.md,
    },
    chartSkeleton: {
        justifyContent: 'flex-end',
        paddingBottom: Spacing.md,
    },
    chartBars: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
    },
});
