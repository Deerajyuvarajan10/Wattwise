/**
 * App Entry Point
 * Redirects to login screen
 */
import { Redirect } from 'expo-router';
import { useStore } from '../store/useStore';

export default function Index() {
    const { user } = useStore();

    // If user is logged in, go to tabs, otherwise go to login
    if (user) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}
