/**
 * Toast Notification Component
 * Animated toast messages for success, error, warning
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Colors, Spacing } from '../constants/Theme';
import { CheckCircle, XCircle, AlertTriangle, X, Info } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    visible: boolean;
    message: string;
    type?: ToastType;
    duration?: number;
    onDismiss: () => void;
}

const getToastConfig = (type: ToastType) => {
    switch (type) {
        case 'success':
            return {
                icon: <CheckCircle size={20} color={Colors.success} />,
                color: Colors.success,
                bgColor: 'rgba(0, 255, 157, 0.15)',
                borderColor: 'rgba(0, 255, 157, 0.3)',
            };
        case 'error':
            return {
                icon: <XCircle size={20} color={Colors.danger} />,
                color: Colors.danger,
                bgColor: 'rgba(255, 51, 51, 0.15)',
                borderColor: 'rgba(255, 51, 51, 0.3)',
            };
        case 'warning':
            return {
                icon: <AlertTriangle size={20} color={Colors.warning} />,
                color: Colors.warning,
                bgColor: 'rgba(255, 170, 0, 0.15)',
                borderColor: 'rgba(255, 170, 0, 0.3)',
            };
        case 'info':
        default:
            return {
                icon: <Info size={20} color={Colors.primary} />,
                color: Colors.primary,
                bgColor: 'rgba(0, 243, 255, 0.15)',
                borderColor: 'rgba(0, 243, 255, 0.3)',
            };
    }
};

export const Toast: React.FC<ToastProps> = ({
    visible,
    message,
    type = 'info',
    duration = 3000,
    onDismiss,
}) => {
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            // Slide in
            Animated.parallel([
                Animated.spring(translateY, {
                    toValue: 0,
                    tension: 100,
                    friction: 10,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();

            // Auto dismiss
            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => onDismiss());
    };

    if (!visible) return null;

    const config = getToastConfig(type);

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    opacity,
                    backgroundColor: config.bgColor,
                    borderColor: config.borderColor,
                },
            ]}
        >
            {config.icon}
            <Text style={[styles.message, { color: config.color }]}>{message}</Text>
            <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                <X size={16} color={Colors.textMuted} />
            </TouchableOpacity>
        </Animated.View>
    );
};

// Toast Manager for global use
interface ToastState {
    visible: boolean;
    message: string;
    type: ToastType;
}

let toastRef: React.Dispatch<React.SetStateAction<ToastState>> | null = null;

export const showToast = (message: string, type: ToastType = 'info') => {
    if (toastRef) {
        toastRef({ visible: true, message, type });
    }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toast, setToast] = React.useState<ToastState>({
        visible: false,
        message: '',
        type: 'info',
    });

    useEffect(() => {
        toastRef = setToast;
        return () => {
            toastRef = null;
        };
    }, []);

    return (
        <View style={{ flex: 1 }}>
            {children}
            <Toast
                visible={toast.visible}
                message={toast.message}
                type={toast.type}
                onDismiss={() => setToast(prev => ({ ...prev, visible: false }))}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 50,
        left: Spacing.md,
        right: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 9999,
    },
    message: {
        flex: 1,
        marginLeft: Spacing.sm,
        fontSize: 14,
        fontWeight: '500',
    },
    closeButton: {
        padding: 4,
    },
});
