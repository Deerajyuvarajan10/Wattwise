/**
 * Readings History Screen
 * Displays all meter readings with edit functionality
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { GlassCard } from '../components/GlassCard';
import { EditReadingModal } from '../components/EditReadingModal';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { Sun, Moon, Edit, Calendar } from 'lucide-react-native';
import { useStore } from '../store/useStore';

interface Reading {
    date: string;
    time_of_day: string;
    reading_kwh: number;
}

export default function ReadingsHistoryScreen() {
    const { fetchReadings, updateReading } = useStore();
    const [readings, setReadings] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingReading, setEditingReading] = useState<Reading | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    useEffect(() => {
        loadReadings();
    }, []);

    const loadReadings = async () => {
        setLoading(true);
        try {
            const data = await fetchReadings();
            setReadings(data);
        } catch (error) {
            console.error('Failed to load readings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (reading: Reading) => {
        setEditingReading(reading);
        setShowEditModal(true);
    };

    const handleSaveEdit = async (date: string, timeOfDay: string, newReading: number) => {
        await updateReading(date, timeOfDay, newReading);
        await loadReadings(); // Refresh the list
    };

    const groupedReadings = readings.reduce((acc, reading) => {
        const date = reading.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(reading);
        return acc;
    }, {} as Record<string, Reading[]>);

    const renderDateGroup = ({ item }: { item: [string, Reading[]] }) => {
        const [date, dateReadings] = item;
        const morning = dateReadings.find(r => r.time_of_day === 'morning');
        const night = dateReadings.find(r => r.time_of_day === 'night');

        const consumption = morning && night
            ? Math.max(0, night.reading_kwh - morning.reading_kwh)
            : null;

        return (
            <GlassCard style={styles.dateCard}>
                <View style={styles.dateHeader}>
                    <Calendar size={18} color={Colors.primary} />
                    <Text style={styles.dateText}>
                        {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </Text>
                </View>

                {morning && (
                    <View style={styles.readingRow}>
                        <View style={styles.readingInfo}>
                            <Sun size={20} color={Colors.warning} />
                            <View style={styles.readingDetails}>
                                <Text style={styles.readingLabel}>Morning</Text>
                                <Text style={styles.readingValue}>{morning.reading_kwh.toFixed(1)} kWh</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEdit(morning)}
                        >
                            <Edit size={18} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                {night && (
                    <View style={styles.readingRow}>
                        <View style={styles.readingInfo}>
                            <Moon size={20} color={Colors.primary} />
                            <View style={styles.readingDetails}>
                                <Text style={styles.readingLabel}>Night</Text>
                                <Text style={styles.readingValue}>{night.reading_kwh.toFixed(1)} kWh</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.editButton}
                            onPress={() => handleEdit(night)}
                        >
                            <Edit size={18} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                )}

                {consumption !== null && (
                    <View style={styles.consumptionBadge}>
                        <Text style={styles.consumptionText}>
                            Daily: {consumption.toFixed(2)} kWh
                        </Text>
                    </View>
                )}
            </GlassCard>
        );
    };

    const sortedDates = Object.entries(groupedReadings).sort((a, b) =>
        b[0].localeCompare(a[0])
    );

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <Text style={styles.title}>Readings History</Text>
                <Text style={styles.subtitle}>View and edit your meter readings</Text>

                <FlatList
                    data={sortedDates}
                    renderItem={renderDateGroup}
                    keyExtractor={(item) => item[0]}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={loading}
                            onRefresh={loadReadings}
                            tintColor={Colors.primary}
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Calendar size={48} color={Colors.textMuted} />
                            <Text style={styles.emptyText}>No readings yet</Text>
                            <Text style={styles.emptySubtext}>
                                Add your first reading to get started
                            </Text>
                        </View>
                    }
                />

                <EditReadingModal
                    visible={showEditModal}
                    reading={editingReading}
                    onClose={() => setShowEditModal(false)}
                    onSave={handleSaveEdit}
                />
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.lg,
    },
    title: {
        ...Typography.h2,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.body,
        marginBottom: Spacing.lg,
    },
    list: {
        paddingBottom: Spacing.xl,
    },
    dateCard: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    dateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.cardBorder,
    },
    dateText: {
        ...Typography.h3,
        fontSize: 16,
    },
    readingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    readingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    readingDetails: {
        flex: 1,
    },
    readingLabel: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    readingValue: {
        ...Typography.h3,
        fontSize: 18,
    },
    editButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    consumptionBadge: {
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.cardBorder,
        alignItems: 'center',
    },
    consumptionText: {
        color: Colors.success,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xl * 2,
    },
    emptyText: {
        ...Typography.h3,
        marginTop: Spacing.md,
    },
    emptySubtext: {
        ...Typography.body,
        marginTop: Spacing.xs,
    },
});
