/**
 * Push Notifications Service
 * Uses Expo Notifications with Firebase Cloud Messaging
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export interface NotificationData {
    title: string;
    body: string;
    data?: Record<string, any>;
}

class NotificationService {
    private expoPushToken: string | null = null;

    /**
     * Initialize notifications and get push token
     */
    async initialize(): Promise<string | null> {
        if (!Device.isDevice) {
            console.log('Push notifications only work on physical devices');
            return null;
        }

        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Push notification permission denied');
            return null;
        }

        // Get Expo push token
        try {
            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            const token = await Notifications.getExpoPushTokenAsync({
                projectId: projectId,
            });
            this.expoPushToken = token.data;
            console.log('Push token:', this.expoPushToken);
            return this.expoPushToken;
        } catch (error) {
            console.log('Error getting push token:', error);
            return null;
        }
    }

    /**
     * Get current push token
     */
    getToken(): string | null {
        return this.expoPushToken;
    }

    /**
     * Schedule a local notification
     */
    async scheduleLocalNotification(
        notification: NotificationData,
        trigger: Notifications.NotificationTriggerInput = null
    ): Promise<string> {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                sound: true,
            },
            trigger,
        });
    }

    /**
     * Send immediate local notification
     */
    async sendImmediateNotification(notification: NotificationData): Promise<string> {
        return this.scheduleLocalNotification(notification, null);
    }

    /**
     * Schedule daily reminder at specific time
     */
    async scheduleDailyReminder(hour: number, minute: number): Promise<string> {
        return await Notifications.scheduleNotificationAsync({
            content: {
                title: '⚡ Time for Meter Reading',
                body: 'Don\'t forget to log your electricity meter reading!',
                sound: true,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
            },
        });
    }

    /**
     * Send anomaly alert
     */
    async sendAnomalyAlert(consumption: number, date: string): Promise<string> {
        return this.sendImmediateNotification({
            title: '⚠️ Unusual Usage Detected',
            body: `Your consumption on ${date} (${consumption} kWh) is unusually high.`,
            data: { type: 'anomaly', date, consumption },
        });
    }

    /**
     * Send weekly summary notification
     */
    async sendWeeklySummary(totalKwh: number, totalCost: number): Promise<string> {
        return this.sendImmediateNotification({
            title: '📊 Weekly Energy Report',
            body: `This week: ${totalKwh.toFixed(1)} kWh (₹${totalCost.toFixed(0)})`,
            data: { type: 'weekly_summary' },
        });
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAllNotifications(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    }

    /**
     * Get all scheduled notifications
     */
    async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
        return await Notifications.getAllScheduledNotificationsAsync();
    }

    /**
     * Add notification received listener
     */
    addNotificationReceivedListener(
        callback: (notification: Notifications.Notification) => void
    ): Notifications.Subscription {
        return Notifications.addNotificationReceivedListener(callback);
    }

    /**
     * Add notification response listener (when user taps notification)
     */
    addNotificationResponseListener(
        callback: (response: Notifications.NotificationResponse) => void
    ): Notifications.Subscription {
        return Notifications.addNotificationResponseReceivedListener(callback);
    }
}

export const notificationService = new NotificationService();
