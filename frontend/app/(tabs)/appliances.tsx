import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import { EmptyState } from '../../components/EmptyState';
import { ListItemSkeleton } from '../../components/SkeletonLoader';
import { Colors, Spacing, Typography } from '../../constants/Theme';
import { Trash2, Plus, Zap, Search, SortDesc } from 'lucide-react-native';
import { BlurView } from 'expo-blur';

export default function AppliancesScreen() {
    const { appliances, fetchAppliances, addAppliance, deleteAppliance, isLoading } = useStore();
    const [modalVisible, setModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [watts, setWatts] = useState('');
    const [hours, setHours] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortByConsumption, setSortByConsumption] = useState(false);

    useEffect(() => {
        fetchAppliances();
    }, []);

    const handleAdd = async () => {
        if (!name || !watts || !hours) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }
        try {
            await addAppliance({
                name,
                power_rating_watts: parseFloat(watts),
                usage_duration_hours_per_day: parseFloat(hours),
            });
            setModalVisible(false);
            setName('');
            setWatts('');
            setHours('');
        } catch (error: any) {
            Alert.alert('Error', 'Failed to add appliance: ' + error.message);
        }
    };

    const handleDelete = (id: string, appName: string) => {
        Alert.alert('Delete Appliance', `Are you sure you want to delete "${appName}"?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => deleteAppliance(id) }
        ]);
    };

    const getConsumption = (watts: number, hours: number) => (watts * hours) / 1000;

    // Filter and sort appliances
    let filteredAppliances = appliances.filter(app =>
        app.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortByConsumption) {
        filteredAppliances = [...filteredAppliances].sort((a, b) => {
            const consumptionA = getConsumption(a.power_rating_watts, a.usage_duration_hours_per_day);
            const consumptionB = getConsumption(b.power_rating_watts, b.usage_duration_hours_per_day);
            return consumptionB - consumptionA;
        });
    }

    // Calculate totals
    const totalDailyKwh = appliances.reduce((sum, app) =>
        sum + getConsumption(app.power_rating_watts, app.usage_duration_hours_per_day), 0
    );

    if (isLoading && appliances.length === 0) {
        return (
            <ScreenWrapper>
                <View style={styles.list}>
                    <Text style={styles.pageTitle}>My Appliances</Text>
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper>
            <FlatList
                data={filteredAppliances}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <>
                        <Text style={styles.pageTitle}>My Appliances</Text>

                        {/* Summary Card */}
                        {appliances.length > 0 && (
                            <GlassCard style={styles.summaryCard}>
                                <View style={styles.summaryRow}>
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryValue}>{appliances.length}</Text>
                                        <Text style={styles.summaryLabel}>Appliances</Text>
                                    </View>
                                    <View style={styles.summaryDivider} />
                                    <View style={styles.summaryItem}>
                                        <Text style={styles.summaryValue}>{totalDailyKwh.toFixed(1)}</Text>
                                        <Text style={styles.summaryLabel}>Est. kWh/Day</Text>
                                    </View>
                                    <View style={styles.summaryDivider} />
                                    <View style={styles.summaryItem}>
                                        <Text style={[styles.summaryValue, { color: Colors.success }]}>
                                            ₹{(totalDailyKwh * 8).toFixed(0)}
                                        </Text>
                                        <Text style={styles.summaryLabel}>Est. Cost/Day</Text>
                                    </View>
                                </View>
                            </GlassCard>
                        )}

                        {/* Search and Sort */}
                        {appliances.length > 0 && (
                            <View style={styles.toolbar}>
                                <View style={styles.searchBox}>
                                    <Search size={18} color={Colors.textMuted} />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder="Search appliances..."
                                        placeholderTextColor={Colors.textMuted}
                                        value={searchQuery}
                                        onChangeText={setSearchQuery}
                                    />
                                </View>
                                <TouchableOpacity
                                    style={[styles.sortButton, sortByConsumption && styles.sortButtonActive]}
                                    onPress={() => setSortByConsumption(!sortByConsumption)}
                                >
                                    <SortDesc size={18} color={sortByConsumption ? Colors.primary : Colors.textMuted} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                }
                ListEmptyComponent={
                    searchQuery ? (
                        <Text style={styles.noResults}>No appliances match "{searchQuery}"</Text>
                    ) : (
                        <EmptyState
                            type="appliances"
                            actionLabel="Add First Appliance"
                            onAction={() => setModalVisible(true)}
                        />
                    )
                }
                renderItem={({ item, index }) => {
                    const dailyKwh = getConsumption(item.power_rating_watts, item.usage_duration_hours_per_day);
                    const isHigh = dailyKwh > 5;
                    const percentage = totalDailyKwh > 0 ? (dailyKwh / totalDailyKwh) * 100 : 0;

                    return (
                        <GlassCard style={styles.card} highlight={isHigh}>
                            <View style={styles.cardContent}>
                                <View style={[styles.iconContainer, isHigh && styles.iconContainerHigh]}>
                                    <Zap size={22} color={isHigh ? Colors.warning : Colors.primary} />
                                </View>
                                <View style={styles.info}>
                                    <Text style={styles.cardTitle}>{item.name}</Text>
                                    <Text style={styles.cardSub}>
                                        {item.power_rating_watts}W • {item.usage_duration_hours_per_day}h/day
                                    </Text>
                                    <View style={styles.statsRow}>
                                        <Text style={styles.dailyKwh}>{dailyKwh.toFixed(2)} kWh/day</Text>
                                        <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
                                    </View>
                                    {isHigh && <Text style={styles.highBadge}>⚡ High Consumer</Text>}
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleDelete(item.id, item.name)}
                                    style={styles.deleteBtn}
                                >
                                    <Trash2 size={18} color={Colors.danger + '80'} />
                                </TouchableOpacity>
                            </View>
                            {/* Usage bar */}
                            <View style={styles.usageBarBg}>
                                <View
                                    style={[
                                        styles.usageBar,
                                        {
                                            width: `${Math.min(percentage, 100)}%`,
                                            backgroundColor: isHigh ? Colors.warning : Colors.primary
                                        }
                                    ]}
                                />
                            </View>
                        </GlassCard>
                    );
                }}
            />

            {/* FAB */}
            <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
                <Plus size={28} color="#fff" />
            </TouchableOpacity>

            {/* Add Appliance Modal */}
            <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Appliance</Text>

                        <Text style={styles.label}>Appliance Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Air Conditioner"
                            placeholderTextColor={Colors.textMuted}
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Power Rating (Watts)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 2000"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="numeric"
                            value={watts}
                            onChangeText={setWatts}
                        />

                        <Text style={styles.label}>Est. Daily Usage (Hours)</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. 8"
                            placeholderTextColor={Colors.textMuted}
                            keyboardType="numeric"
                            value={hours}
                            onChangeText={setHours}
                        />

                        {/* Preview */}
                        {watts && hours && (
                            <View style={styles.preview}>
                                <Text style={styles.previewLabel}>Estimated Daily Usage:</Text>
                                <Text style={styles.previewValue}>
                                    {((parseFloat(watts) || 0) * (parseFloat(hours) || 0) / 1000).toFixed(2)} kWh
                                </Text>
                            </View>
                        )}

                        <View style={styles.modalButtons}>
                            <NeonButton
                                title="Cancel"
                                onPress={() => setModalVisible(false)}
                                variant="secondary"
                                style={{ flex: 1 }}
                            />
                            <NeonButton
                                title="Save"
                                onPress={handleAdd}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    list: {
        padding: Spacing.md,
        paddingTop: Spacing.xl,
        paddingBottom: 100,
    },
    pageTitle: {
        ...Typography.h2,
        marginBottom: Spacing.md
    },
    summaryCard: {
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryValue: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '700',
    },
    summaryLabel: {
        color: Colors.textMuted,
        fontSize: 11,
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    toolbar: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    searchBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        paddingHorizontal: Spacing.sm,
        gap: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: Colors.textPrimary,
        paddingVertical: 12,
        fontSize: 14,
    },
    sortButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sortButtonActive: {
        backgroundColor: Colors.primary + '20',
        borderWidth: 1,
        borderColor: Colors.primary + '40',
    },
    noResults: {
        color: Colors.textMuted,
        textAlign: 'center',
        padding: Spacing.xl,
    },
    card: {
        marginBottom: Spacing.md,
        padding: 0,
        overflow: 'hidden',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerHigh: {
        backgroundColor: Colors.warning + '15',
    },
    info: {
        flex: 1
    },
    cardTitle: {
        ...Typography.h3,
        color: Colors.textPrimary,
        fontSize: 16,
    },
    cardSub: {
        color: Colors.textSecondary,
        fontSize: 13,
        marginTop: 2,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: 4,
    },
    dailyKwh: {
        color: Colors.primary,
        fontSize: 12,
        fontWeight: '600',
    },
    percentage: {
        color: Colors.textMuted,
        fontSize: 11,
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    highBadge: {
        color: Colors.warning,
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4
    },
    deleteBtn: {
        padding: 10,
        backgroundColor: Colors.danger + '10',
        borderRadius: 10,
    },
    usageBarBg: {
        height: 3,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    usageBar: {
        height: '100%',
        borderRadius: 2,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 90,
        backgroundColor: Colors.primary,
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        backgroundColor: 'rgba(0,0,0,0.7)'
    },
    modalContent: {
        backgroundColor: '#0a1525',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
    },
    modalTitle: {
        ...Typography.h2,
        marginBottom: Spacing.lg,
        textAlign: 'center'
    },
    label: {
        color: Colors.textSecondary,
        marginBottom: 8,
        fontSize: 13,
        fontWeight: '500',
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        padding: 14,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        marginBottom: 16,
    },
    preview: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: Colors.primary + '10',
        borderRadius: 10,
        padding: Spacing.sm,
        marginBottom: Spacing.md,
    },
    previewLabel: {
        color: Colors.textSecondary,
        fontSize: 13,
    },
    previewValue: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 8
    },
});
