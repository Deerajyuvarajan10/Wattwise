import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { MaterialIcons } from '@expo/vector-icons';

export default function AlertsScreen() {
    const { dailyUsage, fetchDailyUsage } = useStore();

    useEffect(() => {
        fetchDailyUsage();
    }, []);

    const alerts = dailyUsage.filter(d => d.is_anomaly);

    return (
        <View style={styles.container}>
            {alerts.length === 0 ? (
                <View style={styles.empty}>
                    <MaterialIcons name="check-circle" size={64} color="#10B981" />
                    <Text style={styles.emptyText}>No anomalies detected!</Text>
                    <Text style={styles.emptySub}>Your consumption is normal.</Text>
                </View>
            ) : (
                <FlatList
                    data={alerts}
                    keyExtractor={(item) => item.date}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.header}>
                                <MaterialIcons name="warning" size={24} color="#EF4444" />
                                <Text style={styles.title}>High Consumption Alert</Text>
                            </View>
                            <Text style={styles.date}>{item.date}</Text>
                            <Text style={styles.desc}>
                                Usage of {item.consumption_kwh} kWh exceeded normal patterns.
                                Cost: ₹{item.cost.toFixed(2)}
                            </Text>
                        </View>
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f9fafb' },
    list: { padding: 20 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginTop: 16 },
    emptySub: { fontSize: 16, color: '#6b7280', marginTop: 4 },
    card: {
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    title: { fontSize: 16, fontWeight: 'bold', color: '#B91C1C', marginLeft: 8 },
    date: { fontSize: 14, color: '#7F1D1D', marginBottom: 4, fontWeight: '600' },
    desc: { fontSize: 14, color: '#991B1B' },
});
