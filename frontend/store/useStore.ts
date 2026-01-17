import { create } from 'zustand';
import axios from 'axios';
import { offlineStorage } from '../services/offlineStorage';

// Replace with your backend URL
const API_URL = 'http://192.168.29.191:8000';

// Set to false for production with Google Sign-In
const DEMO_MODE = false;

interface Appliance {
    id: string;
    name: string;
    power_rating_watts: number;
    usage_duration_hours_per_day: number;
    category?: string;
}

interface Reading {
    date: string;
    time_of_day: 'morning' | 'night';
    reading_kwh: number;
}

interface DailyUsage {
    date: string;
    consumption_kwh: number;
    cost: number;
    is_anomaly: boolean;
    readings_count: number;
}

interface MonthlyReport {
    month: string;
    stats: {
        days_recorded: number;
        total_kwh: number;
        total_cost: number;
        avg_daily_kwh: number;
        peak_kwh: number;
        min_kwh: number;
        anomaly_days: number;
    };
    daily_data: DailyUsage[];
}

interface BillPrediction {
    predicted_monthly_kwh: number;
    predicted_monthly_cost: number;
    avg_daily_kwh: number;
    avg_daily_cost: number;
    current_month: {
        month: string;
        kwh_so_far: number;
        cost_so_far: number;
        days_recorded: number;
    };
}

interface DashboardSummary {
    today: {
        consumption_kwh: number;
        cost: number;
        is_anomaly: boolean;
    };
    week: {
        total_kwh: number;
        total_cost: number;
        avg_daily_kwh: number;
        trend_percent: number;
    };
    prediction: BillPrediction;
    recent_usage: DailyUsage[];
}

interface UserSettings {
    electricity_rate: number;
    notifications_enabled: boolean;
    weekly_digest_enabled: boolean;
    theme: string;
}

interface Tips {
    appliance_specific: any[];
    usage_based: any[];
    general_tips: any[];
    summary: {
        avg_daily_kwh: number;
        total_recommendations: number;
        high_priority_count: number;
    };
}

export interface AppState {
    user: any | null;
    appliances: Appliance[];
    readings: Reading[];
    dailyUsage: DailyUsage[];
    monthlyReport: MonthlyReport | null;
    billPrediction: BillPrediction | null;
    dashboardSummary: DashboardSummary | null;
    settings: UserSettings | null;
    tips: Tips | null;
    isLoading: boolean;
    isOffline: boolean;
    error: string | null;

    // Auth
    setUser: (user: any) => void;
    logout: () => Promise<void>;

    // Appliances
    fetchAppliances: () => Promise<void>;
    addAppliance: (app: Omit<Appliance, 'id'>) => Promise<void>;
    deleteAppliance: (id: string) => Promise<void>;

    // Readings
    fetchReadings: () => Promise<void>;
    addReading: (reading: Reading) => Promise<void>;
    fetchDailyUsage: () => Promise<void>;

    // Reports & Analytics
    fetchMonthlyReport: (month: string) => Promise<void>;
    fetchBillPrediction: () => Promise<void>;
    fetchDashboardSummary: () => Promise<void>;
    fetchTips: () => Promise<void>;

    // Settings
    fetchSettings: () => Promise<void>;
    updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';

const getAuthHeaders = async () => {
    if (DEMO_MODE) {
        return { Authorization: 'Bearer demo-token-for-testing' };
    }

    try {
        const user = auth.currentUser;
        if (user) {
            const token = await user.getIdToken();
            return { Authorization: `Bearer ${token}` };
        }
    } catch (error) {
        console.log('Auth error:', error);
    }
    return {};
};

export const useStore = create<AppState>((set, get) => ({
    user: null,
    appliances: [],
    readings: [],
    dailyUsage: [],
    monthlyReport: null,
    billPrediction: null,
    dashboardSummary: null,
    settings: null,
    tips: null,
    isLoading: false,
    isOffline: false,
    error: null,

    setUser: (user) => set({ user }),

    logout: async () => {
        try {
            await signOut(auth);
            set({
                user: null,
                appliances: [],
                readings: [],
                dailyUsage: [],
                monthlyReport: null,
                billPrediction: null,
                dashboardSummary: null,
                settings: null,
                tips: null,
            });
            await offlineStorage.clearAll();
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    // ==================== APPLIANCES ====================

    fetchAppliances: async () => {
        set({ isLoading: true });
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_URL}/appliances`, { headers });
            const appliances = res.data;
            set({ appliances, isLoading: false, isOffline: false });
            // Cache for offline
            await offlineStorage.cacheAppliances(appliances);
        } catch (err: any) {
            console.log('fetchAppliances error:', err.message);
            // Try to load from cache
            const cached = await offlineStorage.getCachedAppliances();
            set({
                appliances: cached,
                isLoading: false,
                isOffline: true,
                error: err.message
            });
        }
    },

    addAppliance: async (app) => {
        set({ isLoading: true });
        try {
            const headers = await getAuthHeaders();
            const res = await axios.post(`${API_URL}/appliances`, app, { headers });
            set((state) => ({
                appliances: [...state.appliances, res.data],
                isLoading: false
            }));
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    deleteAppliance: async (id) => {
        try {
            const headers = await getAuthHeaders();
            await axios.delete(`${API_URL}/appliances/${id}`, { headers });
            set((state) => ({
                appliances: state.appliances.filter(a => a.id !== id)
            }));
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    // ==================== READINGS ====================

    fetchReadings: async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_URL}/readings`, { headers });
            const readings = res.data;
            set({ readings, isOffline: false });
            await offlineStorage.cacheReadings(readings);
        } catch (err: any) {
            const cached = await offlineStorage.getCachedReadings();
            set({ readings: cached, isOffline: true, error: err.message });
        }
    },

    addReading: async (reading) => {
        set({ isLoading: true });

        const isOnline = await offlineStorage.checkOnline();

        if (!isOnline) {
            // Save locally for later sync
            await offlineStorage.addLocalReading(reading);
            set((state) => ({
                readings: [...state.readings, reading],
                isLoading: false,
                isOffline: true
            }));
            return;
        }

        try {
            const headers = await getAuthHeaders();
            await axios.post(`${API_URL}/readings`, reading, { headers });
            await get().fetchDailyUsage();
            set((state) => ({
                readings: [...state.readings, reading],
                isLoading: false
            }));
        } catch (err: any) {
            // Fallback to offline save
            await offlineStorage.addLocalReading(reading);
            set({ error: err.message, isLoading: false, isOffline: true });
        }
    },

    fetchDailyUsage: async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_URL}/daily-usage`, { headers });
            const dailyUsage = res.data;
            set({ dailyUsage, isOffline: false });
            await offlineStorage.cacheDailyUsage(dailyUsage);
        } catch (err: any) {
            const cached = await offlineStorage.getCachedDailyUsage();
            set({ dailyUsage: cached, isOffline: true, error: err.message });
        }
    },

    // ==================== REPORTS & ANALYTICS ====================

    fetchMonthlyReport: async (month) => {
        set({ isLoading: true });
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_URL}/reports/monthly?month=${month}`, { headers });
            set({ monthlyReport: res.data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false, monthlyReport: null });
        }
    },

    fetchBillPrediction: async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_URL}/predictions/bill`, { headers });
            set({ billPrediction: res.data });
        } catch (err: any) {
            console.log('fetchBillPrediction error:', err.message);
        }
    },

    fetchDashboardSummary: async () => {
        set({ isLoading: true });
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_URL}/dashboard/summary`, { headers });
            set({ dashboardSummary: res.data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    fetchTips: async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_URL}/tips`, { headers });
            set({ tips: res.data });
        } catch (err: any) {
            console.log('fetchTips error:', err.message);
        }
    },

    // ==================== SETTINGS ====================

    fetchSettings: async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_URL}/settings`, { headers });
            const settings = res.data;
            set({ settings });
            await offlineStorage.cacheSettings(settings);
        } catch (err: any) {
            const cached = await offlineStorage.getCachedSettings();
            if (cached) set({ settings: cached });
        }
    },

    updateSettings: async (newSettings) => {
        try {
            const headers = await getAuthHeaders();
            const currentSettings = get().settings || {
                electricity_rate: 8.0,
                notifications_enabled: true,
                weekly_digest_enabled: true,
                theme: 'dark',
            };
            const merged = { ...currentSettings, ...newSettings };
            await axios.put(`${API_URL}/settings`, merged, { headers });
            set({ settings: merged });
            await offlineStorage.cacheSettings(merged);
        } catch (err: any) {
            set({ error: err.message });
        }
    },
}));
