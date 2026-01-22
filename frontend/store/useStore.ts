import { create } from 'zustand';
import axios from 'axios';
import { offlineStorage } from '../services/offlineStorage';

// Replace with your backend URL
// To find your PC's IP: Run 'ipconfig' in PowerShell and look for IPv4 Address under WiFi adapter
// Example: http://192.168.1.100:8000
const API_URL = 'http://192.168.29.191:8000';

// Set to false for production with Google Sign-In
const DEMO_MODE = true;

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
    tips?: string;
}

interface BillingCycle {
    has_cycle: boolean;
    last_bill_date?: string;
    last_bill_reading?: number;
    current_reading?: number;
    cycle_consumption?: number;
    current_slab?: string;
    current_rate?: number;
    days_in_cycle?: number;
    days_remaining?: number;
    cycle_ending_soon?: boolean;
    cycle_ended?: boolean;
    estimated_cycle_end?: string;
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
    billingCycle: BillingCycle | null;
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
    fetchReadings: () => Promise<Reading[]>;
    addReading: (reading: Reading) => Promise<void>;
    updateReading: (date: string, timeOfDay: string, newReading: number) => Promise<void>;
    fetchDailyUsage: () => Promise<void>;

    // Reports & Analytics
    fetchMonthlyReport: (month: string) => Promise<void>;
    fetchBillPrediction: () => Promise<void>;
    fetchDashboardSummary: () => Promise<void>;
    fetchTips: () => Promise<void>;

    // Settings
    fetchSettings: () => Promise<void>;
    updateSettings: (settings: Partial<UserSettings>) => Promise<void>;

    // Billing Cycle
    saveBillingCycle: (data: { last_bill_date: string; last_bill_reading: number; last_bill_amount?: number }) => Promise<void>;
    fetchBillingCycle: () => Promise<void>;
}

// Demo mode - no Firebase needed
const getAuthHeaders = async () => {
    // Always use demo token
    return { Authorization: 'Bearer demo-token-for-testing' };
};

// Configure axios defaults
axios.defaults.timeout = 10000; // 10 second timeout

// Helper to check backend connectivity
const checkBackendConnection = async () => {
    try {
        console.log('Checking backend connection to:', API_URL);
        const response = await axios.get(`${API_URL}/`, { timeout: 5000 });
        console.log('✓ Backend is reachable:', response.data);
        return true;
    } catch (error: any) {
        console.log('✗ Backend connection failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('  → Backend server is not running or not accessible');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('  → Connection timeout - check firewall or network');
        }
        return false;
    }
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
            // Check backend connectivity first
            await checkBackendConnection();

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
            console.log('=== ADD APPLIANCE DEBUG ===');
            console.log('API_URL:', API_URL);
            console.log('Full URL:', `${API_URL}/appliances`);
            console.log('Headers:', JSON.stringify(headers));
            console.log('Body:', JSON.stringify(app));
            const res = await axios.post(`${API_URL}/appliances`, app, { headers });
            console.log('Response:', res.status, JSON.stringify(res.data));
            set((state) => ({
                appliances: [...state.appliances, res.data],
                isLoading: false
            }));
        } catch (err: any) {
            console.log('=== ADD APPLIANCE ERROR ===');
            console.log('Error message:', err.message);
            console.log('Error response:', err.response?.status, JSON.stringify(err.response?.data));
            console.log('Error config URL:', err.config?.url);
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
            return readings;
        } catch (err: any) {
            const cached = await offlineStorage.getCachedReadings();
            set({ readings: cached, isOffline: true, error: err.message });
            return cached;
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
            console.log('=== ADD READING DEBUG ===');
            console.log('API_URL:', API_URL);
            console.log('Full URL:', `${API_URL}/readings`);
            console.log('Headers:', JSON.stringify(headers));
            console.log('Reading data:', JSON.stringify(reading));

            const response = await axios.post(`${API_URL}/readings`, reading, { headers });

            console.log('Response status:', response.status);
            console.log('Response data:', JSON.stringify(response.data));

            await get().fetchDailyUsage();
            set((state) => ({
                readings: [...state.readings, reading],
                isLoading: false
            }));

            console.log('✓ Reading added successfully');
        } catch (err: any) {
            console.log('=== ADD READING ERROR ===');
            console.log('Error message:', err.message);
            console.log('Error response:', err.response?.status, JSON.stringify(err.response?.data));
            console.log('Error config URL:', err.config?.url);

            // Fallback to offline save
            await offlineStorage.addLocalReading(reading);
            set({ error: err.message, isLoading: false, isOffline: true });
            throw err;
        }
    },

    updateReading: async (date, timeOfDay, newReading) => {
        set({ isLoading: true });
        try {
            const headers = await getAuthHeaders();
            console.log(`Updating reading: ${date} ${timeOfDay} to ${newReading} kWh`);

            await axios.put(
                `${API_URL}/readings/${date}/${timeOfDay}`,
                { reading_kwh: newReading },
                { headers }
            );

            // Refresh readings and daily usage
            await get().fetchReadings();
            await get().fetchDailyUsage();

            set({ isLoading: false });
            console.log('✓ Reading updated successfully');
        } catch (err: any) {
            console.log('Update reading error:', err.message);
            set({ error: err.message, isLoading: false });
            throw err;
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

    // Billing Cycle
    billingCycle: null,

    saveBillingCycle: async (data) => {
        set({ isLoading: true });
        try {
            const headers = await getAuthHeaders();
            await axios.post(`${API_URL}/billing-cycle`, data, { headers });

            // Fetch updated cycle info
            await get().fetchBillingCycle();

            set({ isLoading: false });
        } catch (err: any) {
            console.log('Save billing cycle error:', err.message);
            set({ error: err.message, isLoading: false });
            throw err;
        }
    },

    fetchBillingCycle: async () => {
        try {
            const headers = await getAuthHeaders();
            const res = await axios.get(`${API_URL}/billing-cycle`, { headers });
            set({ billingCycle: res.data, isOffline: false });
        } catch (err: any) {
            console.log('Fetch billing cycle error:', err.message);
            set({ billingCycle: null, error: err.message });
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
