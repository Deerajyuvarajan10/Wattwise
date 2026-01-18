/**
 * Reports Screen
 * Monthly/Yearly analytics with charts and bill predictions
 */
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, Linking } from 'react-native';
import { useStore } from '../../store/useStore';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { GlassCard } from '../../components/GlassCard';
import { StatCard } from '../../components/StatCard';
import { BarChart, MiniLineChart, ProgressRing } from '../../components/Chart';
import { EmptyState } from '../../components/EmptyState';
import { DashboardSkeleton, ChartSkeleton } from '../../components/SkeletonLoader';
import { Colors, Spacing, Typography } from '../../constants/Theme';
import {
    Calendar,
    TrendingUp,
    DollarSign,
    Zap,
    Download,
    ChevronLeft,
    ChevronRight,
    FileText,
    BarChart3
} from 'lucide-react-native';

export default function ReportsScreen() {
    const {
        fetchMonthlyReport,
        fetchBillPrediction,
        monthlyReport,
        billPrediction,
        isLoading
    } = useStore();

    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    useEffect(() => {
        loadData();
    }, [currentMonth]);

    const loadData = async () => {
        await Promise.all([
            fetchMonthlyReport(currentMonth),
            fetchBillPrediction(),
        ]);
    };

    const navigateMonth = (direction: -1 | 1) => {
        const [year, month] = currentMonth.split('-').map(Number);
        const date = new Date(year, month - 1 + direction, 1);
        setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    };

    const formatMonth = (monthStr: string) => {
        const [year, month] = monthStr.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const handleExport = async () => {
        Alert.alert(
            'Export Data',
            'Choose export format',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Download CSV',
                    onPress: () => {
                        Alert.alert('Export', 'CSV export will download to your device. Check the /export/csv endpoint on your server.');
                    }
                },
            ]
        );
    };

    // Prepare chart data
    const chartData = monthlyReport?.daily_data?.slice(-7).map((d: any) => ({
        label: new Date(d.date).getDate().toString(),
        value: d.consumption_kwh,
    })) || [];

    if (isLoading && !monthlyReport) {
        return (
            <ScreenWrapper>
                <DashboardSkeleton />
            </ScreenWrapper>
        );
    }

    const hasData = (monthlyReport?.stats?.days_recorded ?? 0) > 0;

    return (
        <ScreenWrapper>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={loadData} tintColor={Colors.primary} />
                }
            >
                {/* Month Navigator */}
                <View style={styles.monthNav}>
                    <TouchableOpacity onPress={() => navigateMonth(-1)} style={styles.navButton}>
                        <ChevronLeft size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <View style={styles.monthDisplay}>
                        <Calendar size={18} color={Colors.primary} />
                        <Text style={styles.monthText}>{formatMonth(currentMonth)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigateMonth(1)} style={styles.navButton}>
                        <ChevronRight size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {!hasData ? (
                    <EmptyState
                        type="reports"
                        actionLabel="Add Reading"
                    />
                ) : (
                    <>
                        {/* Monthly Stats Grid */}
                        <View style={styles.statsGrid}>
                            <StatCard
                                title="Total Usage"
                                value={monthlyReport?.stats?.total_kwh || 0}
                                unit=" kWh"
                                icon={<Zap size={18} color={Colors.primary} />}
                                color={Colors.primary}
                            />
                            <StatCard
                                title="Total Cost"
                                value={monthlyReport?.stats?.total_cost || 0}
                                prefix="₹"
                                icon={<DollarSign size={18} color={Colors.success} />}
                                color={Colors.success}
                            />
                        </View>

                        {/* Usage Chart */}
                        <GlassCard style={styles.chartCard}>
                            <View style={styles.chartHeader}>
                                <Text style={styles.chartTitle}>Daily Usage (Last 7 Days)</Text>
                                <BarChart3 size={18} color={Colors.textMuted} />
                            </View>
                            {chartData.length > 0 ? (
                                <BarChart data={chartData} height={140} />
                            ) : (
                                <ChartSkeleton height={140} />
                            )}
                        </GlassCard>

                        {/* Quick Stats Row */}
                        <View style={styles.quickStats}>
                            <View style={styles.quickStatItem}>
                                <Text style={styles.quickStatValue}>
                                    {monthlyReport?.stats?.avg_daily_kwh?.toFixed(1) || '0'}
                                </Text>
                                <Text style={styles.quickStatLabel}>Avg/Day (kWh)</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.quickStatItem}>
                                <Text style={styles.quickStatValue}>
                                    {monthlyReport?.stats?.peak_kwh?.toFixed(1) || '0'}
                                </Text>
                                <Text style={styles.quickStatLabel}>Peak (kWh)</Text>
                            </View>
                            <View style={styles.divider} />
                            <View style={styles.quickStatItem}>
                                <Text style={[styles.quickStatValue, { color: Colors.danger }]}>
                                    {monthlyReport?.stats?.anomaly_days || 0}
                                </Text>
                                <Text style={styles.quickStatLabel}>Anomalies</Text>
                            </View>
                        </View>

                        {/* Bill Prediction */}
                        {billPrediction && (
                            <GlassCard highlight style={styles.predictionCard}>
                                <View style={styles.predictionHeader}>
                                    <View>
                                        <Text style={styles.predictionTitle}>Predicted Monthly Bill</Text>
                                        <Text style={styles.predictionSubtitle}>Based on your usage patterns</Text>
                                    </View>
                                    <TrendingUp size={24} color={Colors.warning} />
                                </View>
                                <View style={styles.predictionValue}>
                                    <Text style={styles.predictionAmount}>
                                        ₹{billPrediction.predicted_monthly_cost?.toFixed(0) || '0'}
                                    </Text>
                                    <Text style={styles.predictionKwh}>
                                        (~{billPrediction.predicted_monthly_kwh?.toFixed(0) || '0'} kWh)
                                    </Text>
                                </View>
                                <View style={styles.currentProgress}>
                                    <Text style={styles.currentLabel}>This Month So Far</Text>
                                    <Text style={styles.currentValue}>
                                        ₹{billPrediction.current_month?.cost_so_far?.toFixed(0) || '0'}
                                    </Text>
                                </View>
                            </GlassCard>
                        )}

                        {/* Export Button */}
                        <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
                            <Download size={20} color={Colors.primary} />
                            <Text style={styles.exportText}>Export Report</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scroll: {
        padding: Spacing.md,
        paddingTop: Spacing.xl,
    },
    monthNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    navButton: {
        padding: Spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
    },
    monthDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    monthText: {
        ...Typography.h3,
    },
    statsGrid: {
        gap: Spacing.md,
    },
    chartCard: {
        padding: Spacing.md,
    },
    chartHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    chartTitle: {
        color: Colors.textSecondary,
        fontSize: 14,
        fontWeight: '500',
    },
    quickStats: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    quickStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    quickStatValue: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '700',
    },
    quickStatLabel: {
        color: Colors.textMuted,
        fontSize: 11,
        marginTop: 4,
    },
    divider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginHorizontal: Spacing.sm,
    },
    predictionCard: {
        padding: Spacing.lg,
    },
    predictionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    predictionTitle: {
        ...Typography.h3,
    },
    predictionSubtitle: {
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    predictionValue: {
        marginTop: Spacing.md,
    },
    predictionAmount: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.warning,
    },
    predictionKwh: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    currentProgress: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    currentLabel: {
        color: Colors.textMuted,
        fontSize: 13,
    },
    currentValue: {
        color: Colors.textPrimary,
        fontSize: 14,
        fontWeight: '600',
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        backgroundColor: 'rgba(0, 243, 255, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
        marginTop: Spacing.md,
    },
    exportText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
