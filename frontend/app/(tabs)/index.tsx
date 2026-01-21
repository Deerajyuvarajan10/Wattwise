import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import { StatCard } from '../../components/StatCard';
import { BarChart, MiniLineChart } from '../../components/Chart';
import { DashboardSkeleton } from '../../components/SkeletonLoader';
import { EmptyState } from '../../components/EmptyState';
import { Colors, Spacing, Typography } from '../../constants/Theme';
import {
    Activity,
    Zap,
    Plus,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Lightbulb,
    DollarSign,
    Calendar
} from 'lucide-react-native';

export default function Dashboard() {
    const router = useRouter();
    const {
        dailyUsage,
        fetchDailyUsage,
        fetchDashboardSummary,
        fetchTips,
        fetchBillingCycle,
        dashboardSummary,
        tips,
        billingCycle,
        user,
        isLoading
    } = useStore();

    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([
            fetchDailyUsage(),
            fetchDashboardSummary(),
            fetchTips(),
            fetchBillingCycle(),
        ]);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const today = new Date().toISOString().split('T')[0];
    const todayUsage = dailyUsage.find(d => d.date === today) || dashboardSummary?.today;

    // Health Monitor Logic
    const isAnomaly = todayUsage?.is_anomaly;
    const healthColor = isAnomaly ? Colors.danger : Colors.success;
    const healthText = isAnomaly ? 'Abnormal Usage' : 'Usage Normal';

    // Chart data for last 7 days
    const chartData = dailyUsage.slice(-7).map(d => ({
        label: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2),
        value: d.consumption_kwh,
    }));

    // Weekly trend
    const weekTrend = dashboardSummary?.week?.trend_percent || 0;

    if (isLoading && dailyUsage.length === 0) {
        return (
            <ScreenWrapper>
                <DashboardSkeleton />
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>
                            Hello, {user?.email?.split('@')[0] || 'User'} 👋
                        </Text>
                        <Text style={styles.subGreeting}>Here's your energy overview</Text>
                    </View>
                    <View style={styles.badge}>
                        <Activity size={14} color={healthColor} />
                        <Text style={[styles.badgeText, { color: healthColor }]}>{healthText}</Text>
                    </View>
                </View>

                {/* Main Stats Card */}
                <GlassCard highlight={true} intensity={40} style={styles.mainCard}>
                    <View style={styles.mainStatsHeader}>
                        <View style={styles.mainStatsLabel}>
                            <Calendar size={14} color={Colors.textMuted} />
                            <Text style={styles.cardLabel}>TODAY'S USAGE</Text>
                        </View>
                        <Zap size={20} color={Colors.primary} />
                    </View>

                    <Text style={styles.kwhText}>
                        {todayUsage?.consumption_kwh?.toFixed(1) || '0'}
                        <Text style={styles.unit}> kWh</Text>
                    </Text>

                    <View style={styles.mainCardBottom}>
                        <View style={styles.costContainer}>
                            <DollarSign size={16} color={Colors.success} />
                            <Text style={styles.costValue}>₹{todayUsage?.cost?.toFixed(2) || '0.00'}</Text>
                        </View>
                        {weekTrend !== 0 && (
                            <View style={styles.trendBadge}>
                                {weekTrend > 0 ? (
                                    <TrendingUp size={14} color={Colors.danger} />
                                ) : (
                                    <TrendingDown size={14} color={Colors.success} />
                                )}
                                <Text style={[
                                    styles.trendText,
                                    { color: weekTrend > 0 ? Colors.danger : Colors.success }
                                ]}>
                                    {weekTrend > 0 ? '+' : ''}{weekTrend.toFixed(1)}%
                                </Text>
                            </View>
                        )}
                    </View>
                </GlassCard>

                {/* Quick Stats Row */}
                <View style={styles.quickStatsRow}>
                    <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>
                            {dashboardSummary?.week?.total_kwh?.toFixed(1) || '0'}
                        </Text>
                        <Text style={styles.quickStatLabel}>Week kWh</Text>
                    </View>
                    <View style={styles.quickStatDivider} />
                    <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>
                            ₹{dashboardSummary?.week?.total_cost?.toFixed(0) || '0'}
                        </Text>
                        <Text style={styles.quickStatLabel}>Week Cost</Text>
                    </View>
                    <View style={styles.quickStatDivider} />
                    <View style={styles.quickStat}>
                        <Text style={styles.quickStatValue}>
                            {dashboardSummary?.week?.avg_daily_kwh?.toFixed(1) || '0'}
                        </Text>
                        <Text style={styles.quickStatLabel}>Avg/Day</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <NeonButton
                    title="+ Add Meter Reading"
                    onPress={() => router.push('/add-reading')}
                    style={styles.addButton}
                    variant="primary"
                />

                <NeonButton
                    title="View Readings History"
                    onPress={() => router.push('/readings-history')}
                    style={styles.secondaryButton}
                    variant="secondary"
                />

                {/* Billing Cycle Progress */}
                {billingCycle?.has_cycle ? (
                    <GlassCard style={styles.cycleCard}>
                        <View style={styles.cycleHeader}>
                            <Text style={styles.cycleTitle}>Billing Cycle Progress</Text>
                            <TouchableOpacity onPress={() => router.push('/import-bill')}>
                                <Text style={styles.cycleUpdate}>Update</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.cycleProgress}>
                            <View style={styles.cycleStats}>
                                <Text style={styles.cycleValue}>{billingCycle.cycle_consumption} kWh</Text>
                                <Text style={styles.cycleLabel}>Used this cycle</Text>
                            </View>
                            <View style={styles.cycleStats}>
                                <Text style={[styles.cycleValue, { color: Colors.warning }]}>
                                    {billingCycle.current_slab}
                                </Text>
                                <Text style={styles.cycleLabel}>Current Slab</Text>
                            </View>
                            <View style={styles.cycleStats}>
                                <Text style={styles.cycleValue}>₹{billingCycle.current_rate}/unit</Text>
                                <Text style={styles.cycleLabel}>Rate</Text>
                            </View>
                        </View>

                        <Text style={styles.cycleDays}>
                            Day {billingCycle.days_in_cycle} of ~60 • Ends ~{new Date(billingCycle.estimated_cycle_end || '').toLocaleDateString()}
                        </Text>
                    </GlassCard>
                ) : (
                    <GlassCard style={styles.cycleCard}>
                        <Text style={styles.cycleTitle}>Import Last Bill</Text>
                        <Text style={styles.cycleSubtitle}>
                            Get accurate cost calculations by importing your last TNEB bill
                        </Text>
                        <NeonButton
                            title="Import Bill"
                            onPress={() => router.push('/import-bill')}
                            variant="secondary"
                            style={{ marginTop: Spacing.md }}
                        />
                    </GlassCard>
                )}

                {/* Usage Chart */}
                {chartData.length > 0 && (
                    <GlassCard style={styles.chartCard}>
                        <Text style={styles.chartTitle}>Last 7 Days Usage</Text>
                        <BarChart data={chartData} height={120} />
                    </GlassCard>
                )}

                {/* Tips Section */}
                {tips && tips.appliance_specific.length > 0 && (
                    <>
                        <View style={styles.sectionHeader}>
                            <Lightbulb size={18} color={Colors.warning} />
                            <Text style={styles.sectionTitle}>Energy Tips</Text>
                        </View>
                        <GlassCard style={styles.tipCard}>
                            <Text style={styles.tipText}>
                                💡 {tips.appliance_specific[0]?.tip || tips.general_tips[0]?.description}
                            </Text>
                        </GlassCard>
                    </>
                )}

                {/* Recent History */}
                <Text style={styles.sectionTitle}>Recent Daily Usage</Text>
                {dailyUsage.length === 0 ? (
                    <EmptyState
                        type="readings"
                        actionLabel="Add Reading"
                        onAction={() => router.push('/add-reading')}
                    />
                ) : (
                    dailyUsage.slice(-5).reverse().map((day, index) => (
                        <GlassCard
                            key={`${day.date}-${index}`}
                            style={[styles.historyItem, day.is_anomaly && styles.anomalyBorder]}
                        >
                            <View style={styles.historyRow}>
                                <View>
                                    <Text style={styles.dateText}>{day.date}</Text>
                                    <Text style={styles.statusText}>
                                        {day.readings_count === 2 ? '✓ Completed' : 'Pending Reading'}
                                    </Text>
                                </View>
                                <View style={styles.historyRight}>
                                    <Text style={styles.historyValue}>{day.consumption_kwh} kWh</Text>
                                    <Text style={styles.historyCost}>₹{day.cost.toFixed(2)}</Text>
                                </View>
                            </View>
                            {day.is_anomaly && (
                                <View style={styles.anomalyWarning}>
                                    <AlertTriangle size={14} color={Colors.danger} />
                                    <Text style={styles.anomalyText}>Abnormal Spike Detected</Text>
                                </View>
                            )}
                        </GlassCard>
                    ))
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scroll: {
        padding: Spacing.md,
        paddingTop: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
    },
    greeting: {
        ...Typography.h2,
    },
    subGreeting: {
        color: Colors.textMuted,
        fontSize: 14,
        marginTop: 2,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    badgeText: {
        fontWeight: '600',
        fontSize: 11,
    },
    mainCard: {
        padding: Spacing.lg,
    },
    mainStatsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    mainStatsLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    cardLabel: {
        color: Colors.textMuted,
        fontSize: 11,
        letterSpacing: 1.5,
        fontWeight: '700',
    },
    kwhText: {
        fontSize: 52,
        fontWeight: '800',
        color: Colors.textPrimary,
        textShadowColor: Colors.primary,
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 15,
    },
    unit: {
        fontSize: 20,
        color: Colors.textSecondary,
        fontWeight: '400',
    },
    mainCardBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.sm,
    },
    costContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    costValue: {
        color: Colors.success,
        fontSize: 20,
        fontWeight: 'bold',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    trendText: {
        fontSize: 12,
        fontWeight: '600',
    },
    quickStatsRow: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    quickStat: {
        flex: 1,
        alignItems: 'center',
    },
    quickStatValue: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    quickStatLabel: {
        color: Colors.textMuted,
        fontSize: 11,
        marginTop: 2,
    },
    quickStatDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: Spacing.sm,
    },
    addButton: {
        marginBottom: Spacing.md,
    },
    secondaryButton: {
        marginBottom: Spacing.lg,
    },
    chartCard: {
        padding: Spacing.md,
    },
    chartTitle: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: Spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    sectionTitle: {
        ...Typography.h3,
        marginBottom: Spacing.md,
    },
    tipCard: {
        padding: Spacing.md,
        backgroundColor: 'rgba(255, 170, 0, 0.1)',
        borderColor: Colors.warning + '40',
    },
    tipText: {
        color: Colors.textPrimary,
        fontSize: 14,
        lineHeight: 20,
    },
    historyItem: {
        padding: Spacing.md,
    },
    anomalyBorder: {
        borderColor: Colors.danger,
        borderWidth: 1,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    statusText: {
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    historyRight: {
        alignItems: 'flex-end',
    },
    historyValue: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    historyCost: {
        color: Colors.success,
        fontSize: 14,
    },
    anomalyWarning: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    anomalyText: {
        color: Colors.danger,
        fontSize: 12,
        fontWeight: '600',
    },
    cycleCard: {
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    cycleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    cycleTitle: {
        ...Typography.h3,
        fontSize: 16,
    },
    cycleUpdate: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    cycleProgress: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: Spacing.sm,
    },
    cycleStats: {
        alignItems: 'center',
    },
    cycleValue: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '700',
    },
    cycleLabel: {
        color: Colors.textMuted,
        fontSize: 11,
        marginTop: 4,
    },
    cycleDays: {
        color: Colors.textSecondary,
        fontSize: 12,
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    cycleSubtitle: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginTop: Spacing.xs,
    },
    bottomPadding: {
        height: 20,
    },
});
