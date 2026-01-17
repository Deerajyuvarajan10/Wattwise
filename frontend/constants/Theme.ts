
import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Colors = {
    // Core backgrounds
    background: '#040b14', // Deep Midnight Blue
    cardBg: 'rgba(20, 30, 48, 0.6)', // Translucent Dark Blue
    cardBorder: 'rgba(0, 243, 255, 0.2)', // Faint Neon Cyan

    // Primary palette
    primary: '#00f3ff', // Neon Cyan - Primary Action
    secondary: '#0066ff', // Electric Blue - Secondary / Gradient
    accent: '#ff0055', // Neon Pink/Red - Alerts

    // Text hierarchy
    textPrimary: '#ffffff',
    textSecondary: '#a0aab5',
    textMuted: '#586575',

    // Semantic colors
    success: '#00ff9d',
    warning: '#ffaa00',
    danger: '#ff3333',
    info: '#00b4d8',

    // Light mode (for future)
    lightBackground: '#f8fafc',
    lightCardBg: '#ffffff',
    lightText: '#1e293b',
};

export const Gradients = {
    background: ['#02050a', '#0a1525', '#050b14'],
    primaryMap: ['#00f3ff', '#0066ff'],
    cardMap: ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.0)'],
    alertMap: ['#ff0055', '#cc0044'],
    successMap: ['#00ff9d', '#00cc7a'],
    warningMap: ['#ffaa00', '#ff8800'],
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const Typography = {
    h1: {
        fontSize: 32,
        fontWeight: '700' as const,
        color: Colors.textPrimary,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 24,
        fontWeight: '600' as const,
        color: Colors.textPrimary,
        letterSpacing: -0.3,
    },
    h3: {
        fontSize: 18,
        fontWeight: '600' as const,
        color: Colors.textPrimary
    },
    body: {
        fontSize: 16,
        color: Colors.textSecondary
    },
    bodySmall: {
        fontSize: 14,
        color: Colors.textSecondary
    },
    caption: {
        fontSize: 12,
        color: Colors.textMuted
    },
    label: {
        fontSize: 11,
        fontWeight: '600' as const,
        color: Colors.textMuted,
        letterSpacing: 1,
        textTransform: 'uppercase' as const,
    },
};

export const Layout = {
    window: { width, height },
    isSmallDevice: width < 375,
    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },
};

export const Shadows = {
    small: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    large: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 8,
    },
    glow: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 6,
    }),
};

export const Animation = {
    timing: {
        fast: 150,
        normal: 300,
        slow: 500,
    },
    spring: {
        tension: 100,
        friction: 10,
    },
};
