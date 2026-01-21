import { View, Text, StyleSheet, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScreenWrapper } from '../components/ScreenWrapper';
import { GlassCard } from '../components/GlassCard';
import { NeonButton } from '../components/NeonButton';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { Sun, Moon, Calendar, CheckCircle } from 'lucide-react-native';
import { useStore } from '../store/useStore';

export default function AddReadingScreen() {
    const router = useRouter();
    const { addReading, readings } = useStore();
    const [morning, setMorning] = useState('');
    const [night, setNight] = useState('');
    const [loading, setLoading] = useState(false);
    const [existingMorning, setExistingMorning] = useState<number | null>(null);
    const [existingNight, setExistingNight] = useState<number | null>(null);

    useEffect(() => {
        // Check if there are already readings for today
        const dateStr = new Date().toISOString().split('T')[0];
        const todayReadings = readings.filter(r => r.date === dateStr);

        const morningReading = todayReadings.find(r => r.time_of_day === 'morning');
        const nightReading = todayReadings.find(r => r.time_of_day === 'night');

        if (morningReading) {
            setExistingMorning(morningReading.reading_kwh);
        }
        if (nightReading) {
            setExistingNight(nightReading.reading_kwh);
        }
    }, [readings]);

    const handleSubmit = async () => {
        if (!morning && !night) {
            Alert.alert('Error', 'Please enter at least one reading.');
            return;
        }

        setLoading(true);
        const dateStr = new Date().toISOString().split('T')[0];

        try {
            if (morning && !existingMorning) {
                await addReading({
                    date: dateStr,
                    time_of_day: 'morning',
                    reading_kwh: parseFloat(morning)
                });
            }

            if (night && !existingNight) {
                await addReading({
                    date: dateStr,
                    time_of_day: 'night',
                    reading_kwh: parseFloat(night)
                });
            }

            Alert.alert('Success', 'Readings saved successfully!', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            Alert.alert('Error', 'Failed to save readings: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScreenWrapper>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.title}>Add Meter Reading</Text>
                    <Text style={styles.subtitle}>Enter your meter readings for today to track consumption.</Text>

                    <GlassCard style={styles.card}>
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Sun size={20} color={Colors.warning} />
                                <Text style={styles.label}>Morning Reading (kWh)</Text>
                                {existingMorning && <CheckCircle size={18} color={Colors.success} />}
                            </View>
                            {existingMorning ? (
                                <View style={styles.savedReading}>
                                    <Text style={styles.savedText}>✓ Saved: {existingMorning} kWh</Text>
                                </View>
                            ) : (
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 1540.5"
                                    placeholderTextColor={Colors.textMuted}
                                    keyboardType="numeric"
                                    value={morning}
                                    onChangeText={setMorning}
                                />
                            )}
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Moon size={20} color={Colors.primary} />
                                <Text style={styles.label}>Night Reading (kWh)</Text>
                                {existingNight && <CheckCircle size={18} color={Colors.success} />}
                            </View>
                            {existingNight ? (
                                <View style={styles.savedReading}>
                                    <Text style={styles.savedText}>✓ Saved: {existingNight} kWh</Text>
                                </View>
                            ) : (
                                <>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="e.g. 1552.8"
                                        placeholderTextColor={Colors.textMuted}
                                        keyboardType="numeric"
                                        value={night}
                                        onChangeText={setNight}
                                    />
                                    {existingMorning && (
                                        <Text style={styles.hint}>
                                            💡 Morning reading: {existingMorning} kWh
                                        </Text>
                                    )}
                                </>
                            )}
                        </View>
                    </GlassCard>

                    <View style={styles.infoBox}>
                        <Calendar size={18} color={Colors.textSecondary} />
                        <Text style={styles.infoText}>Readings for: {new Date().toLocaleDateString()}</Text>
                    </View>

                    <View style={styles.actions}>
                        <NeonButton
                            title="Cancel"
                            onPress={() => router.back()}
                            variant="secondary"
                            style={{ flex: 1 }}
                        />
                        <NeonButton
                            title="Save Readings"
                            onPress={handleSubmit}
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
    title: {
        ...Typography.h2,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        ...Typography.body,
        marginBottom: Spacing.xl,
    },
    card: {
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    inputGroup: {
        marginBottom: Spacing.md,
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
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        color: Colors.textPrimary,
        fontWeight: 'bold',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.cardBorder,
        marginVertical: Spacing.md,
    },
    infoBox: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: Spacing.xl,
    },
    infoText: {
        color: Colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    savedReading: {
        backgroundColor: Colors.success + '15',
        borderWidth: 1,
        borderColor: Colors.success + '40',
        borderRadius: 12,
        padding: 16,
    },
    savedText: {
        color: Colors.success,
        fontSize: 18,
        fontWeight: 'bold',
    },
    hint: {
        color: Colors.warning,
        fontSize: 13,
        marginTop: 8,
        fontStyle: 'italic',
    },
});
