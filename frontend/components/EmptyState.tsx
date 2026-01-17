/**
 * Empty State Component
 * Displayed when no data is available
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../constants/Theme';
import { NeonButton } from './NeonButton';
import {
    Inbox,
    BarChart3,
    Zap,
    FileText,
    Settings,
    PlusCircle
} from 'lucide-react-native';

type EmptyStateType = 'appliances' | 'readings' | 'reports' | 'general';

interface EmptyStateProps {
    type?: EmptyStateType;
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}

const getEmptyStateConfig = (type: EmptyStateType) => {
    switch (type) {
        case 'appliances':
            return {
                icon: <Zap size={64} color={Colors.primary} />,
                title: 'No Appliances Yet',
                description: 'Add your household appliances to start tracking their energy consumption.',
            };
        case 'readings':
            return {
                icon: <BarChart3 size={64} color={Colors.primary} />,
                title: 'No Readings',
                description: 'Add your morning and night meter readings to see usage analytics.',
            };
        case 'reports':
            return {
                icon: <FileText size={64} color={Colors.primary} />,
                title: 'No Reports Available',
                description: 'Add meter readings for at least a week to generate usage reports.',
            };
        case 'general':
        default:
            return {
                icon: <Inbox size={64} color={Colors.primary} />,
                title: 'No Data',
                description: 'There\'s nothing here yet. Start adding data to see insights.',
            };
    }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
    type = 'general',
    title,
    description,
    actionLabel,
    onAction,
}) => {
    const config = getEmptyStateConfig(type);

    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <View style={styles.iconGlow} />
                {config.icon}
            </View>

            <Text style={styles.title}>{title || config.title}</Text>
            <Text style={styles.description}>{description || config.description}</Text>

            {actionLabel && onAction && (
                <NeonButton
                    title={actionLabel}
                    onPress={onAction}
                    style={styles.button}
                />
            )}
        </View>
    );
};

// Inline empty indicator for lists
export const InlineEmpty: React.FC<{ message: string }> = ({ message }) => (
    <View style={styles.inlineContainer}>
        <Inbox size={24} color={Colors.textMuted} />
        <Text style={styles.inlineText}>{message}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
        minHeight: 300,
    },
    iconContainer: {
        position: 'relative',
        marginBottom: Spacing.lg,
    },
    iconGlow: {
        position: 'absolute',
        top: -20,
        left: -20,
        right: -20,
        bottom: -20,
        backgroundColor: Colors.primary,
        opacity: 0.1,
        borderRadius: 60,
    },
    title: {
        ...Typography.h2,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    description: {
        ...Typography.body,
        textAlign: 'center',
        color: Colors.textSecondary,
        maxWidth: 280,
    },
    button: {
        marginTop: Spacing.lg,
        minWidth: 160,
    },
    inlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    inlineText: {
        color: Colors.textMuted,
        fontSize: 14,
    },
});
