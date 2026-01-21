/**
 * Settings Screen
 * User preferences, electricity rate, notifications, data export
 */
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    TextInput,
    Alert,
    Platform
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { useStore } from '../../store/useStore';
import { ScreenWrapper } from '../../components/ScreenWrapper';
import { GlassCard } from '../../components/GlassCard';
import { NeonButton } from '../../components/NeonButton';
import { Colors, Spacing, Typography } from '../../constants/Theme';
import SettingsIcon from 'lucide-react-native/dist/esm/icons/settings';
import Zap from 'lucide-react-native/dist/esm/icons/zap';
import Bell from 'lucide-react-native/dist/esm/icons/bell';
import Moon from 'lucide-react-native/dist/esm/icons/moon';
import Download from 'lucide-react-native/dist/esm/icons/download';
import LogOut from 'lucide-react-native/dist/esm/icons/log-out';
import User from 'lucide-react-native/dist/esm/icons/user';
import ChevronRight from 'lucide-react-native/dist/esm/icons/chevron-right';
import IndianRupee from 'lucide-react-native/dist/esm/icons/indian-rupee';
import Mail from 'lucide-react-native/dist/esm/icons/mail';
import Trash2 from 'lucide-react-native/dist/esm/icons/trash-2';
import Info from 'lucide-react-native/dist/esm/icons/info';
import { auth, signOut } from '../../firebaseConfig';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, settings, fetchSettings, updateSettings, setUser } = useStore();

    const [electricityRate, setElectricityRate] = useState('8.0');
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [weeklyDigestEnabled, setWeeklyDigestEnabled] = useState(true);
    const [isDarkTheme, setIsDarkTheme] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (settings) {
            setElectricityRate(settings.electricity_rate?.toString() || '8.0');
            setNotificationsEnabled(settings.notifications_enabled ?? true);
            setWeeklyDigestEnabled(settings.weekly_digest_enabled ?? true);
            setIsDarkTheme(settings.theme === 'dark');
        }
    }, [settings]);

    const handleSaveRate = async () => {
        const rate = parseFloat(electricityRate);
        if (isNaN(rate) || rate <= 0) {
            Alert.alert('Invalid Rate', 'Please enter a valid electricity rate');
            return;
        }
        await updateSettings({ ...settings, electricity_rate: rate });
        Alert.alert('Saved', 'Electricity rate updated');
    };

    const handleToggleNotifications = async (value: boolean) => {
        setNotificationsEnabled(value);
        await updateSettings({ ...settings, notifications_enabled: value });
    };

    const handleToggleDigest = async (value: boolean) => {
        setWeeklyDigestEnabled(value);
        await updateSettings({ ...settings, weekly_digest_enabled: value });
    };

    const handleLogout = async () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut(auth);
                            setUser(null);
                            router.replace('/login');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to logout');
                        }
                    },
                },
            ]
        );
    };

    const handleExportData = async () => {
        try {
            // In a real app, you'd get the token from your auth system
            const headers = { Authorization: 'Bearer demo-token-for-testing' };
            // Replace with your actual backend API URL
            const API_URL = 'http://192.168.1.8:8000';

            const response = await fetch(`${API_URL}/export/csv`, { headers });
            if (!response.ok) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
            const csvData = await response.text();

            const fileName = `wattwise_usage_${new Date().toISOString().split('T')[0]}.csv`;

            if (Platform.OS === 'web') {
                // Web download
                const blob = new Blob([csvData], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url); // Clean up
                Alert.alert('Export Complete', 'Your usage data has been downloaded.');
            } else {
                // Mobile - Save to file and share
                const fileUri = Paths.join(Paths.document.uri, fileName);
                await FileSystem.writeAsStringAsync(fileUri, csvData, {
                    encoding: 'utf8',
                });

                // Share the file
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                    await Sharing.shareAsync(fileUri);
                } else {
                    Alert.alert('Export Complete', `File saved to: ${fileUri}`);
                }
            }
        } catch (error: any) {
            Alert.alert('Export Error', error.message);
        }
    };

    return (
        <ScreenWrapper>
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.pageTitle}>Settings</Text>

                {/* User Profile */}
                <GlassCard style={styles.profileCard}>
                    <View style={styles.profileRow}>
                        <View style={styles.avatar}>
                            <User size={28} color={Colors.primary} />
                        </View>
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>
                                {user?.email?.split('@')[0] || 'User'}
                            </Text>
                            <Text style={styles.profileEmail}>{user?.email || 'Not signed in'}</Text>
                        </View>
                    </View>
                </GlassCard>

                {/* Electricity Rate */}
                <Text style={styles.sectionTitle}>Electricity Settings</Text>
                <GlassCard>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.success + '20' }]}>
                                <IndianRupee size={18} color={Colors.success} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Electricity Rate</Text>
                                <Text style={styles.settingHint}>Cost per kWh in ₹</Text>
                            </View>
                        </View>
                        <View style={styles.rateInput}>
                            <Text style={styles.ratePrefix}>₹</Text>
                            <TextInput
                                style={styles.rateTextInput}
                                value={electricityRate}
                                onChangeText={setElectricityRate}
                                keyboardType="decimal-pad"
                                placeholder="8.0"
                                placeholderTextColor={Colors.textMuted}
                                onBlur={handleSaveRate}
                            />
                        </View>
                    </View>
                </GlassCard>

                {/* Notifications */}
                <Text style={styles.sectionTitle}>Notifications</Text>
                <GlassCard>
                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.warning + '20' }]}>
                                <Bell size={18} color={Colors.warning} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Usage Alerts</Text>
                                <Text style={styles.settingHint}>Get notified about anomalies</Text>
                            </View>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleToggleNotifications}
                            trackColor={{ false: Colors.textMuted, true: Colors.primary + '80' }}
                            thumbColor={notificationsEnabled ? Colors.primary : '#f4f3f4'}
                        />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.secondary + '20' }]}>
                                <Mail size={18} color={Colors.secondary} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Weekly Digest</Text>
                                <Text style={styles.settingHint}>Summary email every week</Text>
                            </View>
                        </View>
                        <Switch
                            value={weeklyDigestEnabled}
                            onValueChange={handleToggleDigest}
                            trackColor={{ false: Colors.textMuted, true: Colors.primary + '80' }}
                            thumbColor={weeklyDigestEnabled ? Colors.primary : '#f4f3f4'}
                        />
                    </View>
                </GlassCard>

                {/* Data & Privacy */}
                <Text style={styles.sectionTitle}>Data & Privacy</Text>
                <GlassCard>
                    <TouchableOpacity style={styles.settingRow} onPress={handleExportData}>
                        <View style={styles.settingLeft}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.primary + '20' }]}>
                                <Download size={18} color={Colors.primary} />
                            </View>
                            <View>
                                <Text style={styles.settingLabel}>Export Data</Text>
                                <Text style={styles.settingHint}>Download your usage history</Text>
                            </View>
                        </View>
                        <ChevronRight size={20} color={Colors.textMuted} />
                    </TouchableOpacity>
                </GlassCard>

                {/* About */}
                <Text style={styles.sectionTitle}>About</Text>
                <GlassCard>
                    <View style={styles.aboutRow}>
                        <View style={styles.aboutItem}>
                            <Text style={styles.aboutLabel}>Version</Text>
                            <Text style={styles.aboutValue}>2.0.0</Text>
                        </View>
                        <View style={styles.aboutItem}>
                            <Text style={styles.aboutLabel}>App</Text>
                            <Text style={styles.aboutValue}>WattWise</Text>
                        </View>
                    </View>
                </GlassCard>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LogOut size={20} color={Colors.danger} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scroll: {
        padding: Spacing.md,
        paddingTop: Spacing.xl,
    },
    pageTitle: {
        ...Typography.h2,
        marginBottom: Spacing.lg,
    },
    profileCard: {
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        ...Typography.h3,
    },
    profileEmail: {
        color: Colors.textSecondary,
        fontSize: 14,
    },
    sectionTitle: {
        color: Colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
    },
    settingLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    settingLabel: {
        color: Colors.textPrimary,
        fontSize: 15,
        fontWeight: '500',
    },
    settingHint: {
        color: Colors.textMuted,
        fontSize: 12,
        marginTop: 2,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        marginVertical: Spacing.sm,
    },
    rateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 10,
        paddingHorizontal: Spacing.sm,
        minWidth: 80,
    },
    ratePrefix: {
        color: Colors.success,
        fontSize: 16,
        fontWeight: '600',
    },
    rateTextInput: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
        paddingVertical: 8,
        paddingHorizontal: 4,
        minWidth: 50,
        textAlign: 'right',
    },
    aboutRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    aboutItem: {
        alignItems: 'center',
    },
    aboutLabel: {
        color: Colors.textMuted,
        fontSize: 12,
    },
    aboutValue: {
        color: Colors.textPrimary,
        fontSize: 14,
        fontWeight: '600',
        marginTop: 4,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        backgroundColor: 'rgba(255, 51, 51, 0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.danger + '50',
        marginTop: Spacing.xl,
    },
    logoutText: {
        color: Colors.danger,
        fontSize: 16,
        fontWeight: '600',
    },
    bottomPadding: {
        height: 40,
    },
});
