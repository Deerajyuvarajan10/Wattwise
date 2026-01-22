/**
 * Theme Context for Light/Dark mode switching
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
    theme: ThemeMode;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'dark',
    toggleTheme: () => { },
    isDark: true,
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<ThemeMode>('dark');

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('app_theme');
            if (savedTheme === 'light' || savedTheme === 'dark') {
                setTheme(savedTheme);
            }
        } catch (e) {
            console.log('Theme load error:', e);
        }
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        try {
            await AsyncStorage.setItem('app_theme', newTheme);
        } catch (e) {
            console.log('Theme save error:', e);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Dynamic colors based on theme
export const getThemeColors = (isDark: boolean) => ({
    background: isDark ? '#040b14' : '#f8fafc',
    cardBg: isDark ? 'rgba(20, 30, 48, 0.6)' : 'rgba(255, 255, 255, 0.9)',
    cardBorder: isDark ? 'rgba(0, 243, 255, 0.2)' : 'rgba(0, 102, 255, 0.2)',

    primary: '#00f3ff',
    secondary: '#0066ff',
    accent: '#ff0055',

    textPrimary: isDark ? '#ffffff' : '#1e293b',
    textSecondary: isDark ? '#a0aab5' : '#64748b',
    textMuted: isDark ? '#586575' : '#94a3b8',

    success: '#00ff9d',
    warning: '#ffaa00',
    danger: '#ff3333',
    info: '#00b4d8',
});
