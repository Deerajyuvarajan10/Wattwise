/**
 * Edit Reading Modal Component
 * Allows users to update existing meter readings
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, TouchableOpacity, Alert } from 'react-native';
import { GlassCard } from './GlassCard';
import { NeonButton } from './NeonButton';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { X } from 'lucide-react-native';

interface EditReadingModalProps {
    visible: boolean;
    reading: {
        date: string;
        time_of_day: string;
        reading_kwh: number;
    } | null;
    onClose: () => void;
    onSave: (date: string, timeOfDay: string, newReading: number) => Promise<void>;
}

export const EditReadingModal: React.FC<EditReadingModalProps> = ({
    visible,
    reading,
    onClose,
    onSave,
}) => {
    const [newValue, setNewValue] = useState('');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        if (reading) {
            setNewValue(reading.reading_kwh.toString());
        }
    }, [reading]);

    const handleSave = async () => {
        if (!reading) return;

        const parsedValue = parseFloat(newValue);
        if (isNaN(parsedValue) || parsedValue < 0) {
            Alert.alert('Invalid Input', 'Please enter a valid positive number.');
            return;
        }

        setLoading(true);
        try {
            await onSave(reading.date, reading.time_of_day, parsedValue);
            onClose();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update reading');
        } finally {
            setLoading(false);
        }
    };

    if (!reading) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <GlassCard style={styles.modal}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Edit Reading</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.label}>Date: {new Date(reading.date).toLocaleDateString()}</Text>
                        <Text style={styles.label}>
                            Time: {reading.time_of_day.charAt(0).toUpperCase() + reading.time_of_day.slice(1)}
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Reading (kWh)</Text>
                            <TextInput
                                style={styles.input}
                                value={newValue}
                                onChangeText={setNewValue}
                                keyboardType="numeric"
                                placeholder="e.g. 1540.5"
                                placeholderTextColor={Colors.textMuted}
                                autoFocus
                            />
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <NeonButton
                            title="Cancel"
                            onPress={onClose}
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
                </GlassCard>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.lg,
    },
    modal: {
        width: '100%',
        maxWidth: 400,
        padding: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        ...Typography.h3,
    },
    closeButton: {
        padding: 4,
    },
    content: {
        marginBottom: Spacing.lg,
    },
    label: {
        ...Typography.body,
        marginBottom: Spacing.xs,
    },
    inputGroup: {
        marginTop: Spacing.md,
    },
    inputLabel: {
        color: Colors.textSecondary,
        fontSize: 14,
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderWidth: 1,
        borderColor: Colors.cardBorder,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        color: Colors.textPrimary,
        fontWeight: 'bold',
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
});
