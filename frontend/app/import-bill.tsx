/**
 * Import Last Bill Screen
 * Allows users to input their last TNEB bill for billing cycle tracking
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { GlassCard } from '../components/GlassCard';
import { NeonButton } from '../components/NeonButton';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { FileText, Calendar, Zap } from 'lucide-react-native';
import { useStore } from '../store/useStore';

export default function ImportBillScreen() {
    const router = useRouter();
    const { saveBillingCycle } = useStore();
    const [loading, setLoading] = useState(false);

    const [billDate, setBillDate] = useState('');
    const [meterReading, setMeterReading] = useState('');
    const [billAmount, setBillAmount] = useState('');

    const handleSave = async () => {
        if (!billDate || !meterReading) {
            Alert.alert('Error', 'Please enter bill date and meter reading');
            return;
        }

        setLoading(true);
        try {
            await saveBillingCycle({
                last_bill_date: billDate,
                last_bill_reading: parseFloat(meterReading),
                last_bill_amount: billAmount ? parseFloat(billAmount) : undefined,
            });

            Alert.alert('Success', 'Billing cycle saved! Your costs will now be more accurate.', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to save billing cycle: ' + error.message);
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <View style={styles.header}>
                        <FileText size={48} color={Colors.primary} />
                        <Text style={styles.title}>Import Last Bill</Text>
                        <Text style={styles.subtitle}>
                            Enter your last TNEB bill details to track billing cycle progress and get accurate costs
                        </Text>
                    </View>

                    <GlassCard style={styles.card}>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoText}>
                                💡 Find this information on your last electricity bill from TNEB
                            </Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Calendar size={20} color={Colors.primary} />
                                <Text style={styles.label}>Last Bill Date</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD (e.g., 2025-12-31)"
                                placeholderTextColor={Colors.textMuted}
                                value={billDate}
                                onChangeText={setBillDate}
                            />
                            <Text style={styles.hint}>Date when your last bill was issued</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Zap size={20} color={Colors.warning} />
                                <Text style={styles.label}>Meter Reading (kWh)</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 1500"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                                value={meterReading}
                                onChangeText={setMeterReading}
                            />
                            <Text style={styles.hint}>The meter reading shown on your bill</Text>
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={styles.label}>Bill Amount (Optional)</Text>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., 800"
                                placeholderTextColor={Colors.textMuted}
                                keyboardType="numeric"
                                value={billAmount}
                                onChangeText={setBillAmount}
                            />
                            <Text style={styles.hint}>Total cost for verification</Text>
                        </View>
                    </GlassCard>

                    <View style={styles.actions}>
                        <NeonButton
                            title="Cancel"
                            onPress={() => router.back()}
                            variant="secondary"
                            style={{ flex: 1 }}
                        />
                        <NeonButton
                            title="Save"
                            onPress={handleSave}
                            loading={loading}
                            style={{ flex: 1 }}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scroll: {
        padding: Spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        ...Typography.h2,
        marginTop: Spacing.md,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.body,
        textAlign: 'center',
        paddingHorizontal: Spacing.md,
    },
    card: {
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    infoBox: {
        backgroundColor: Colors.primary + '10',
        borderRadius: 12,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    infoText: {
        color: Colors.textPrimary,
        fontSize: 14,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    label: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontWeight: '600',
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.textPrimary,
    },
    hint: {
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
});
