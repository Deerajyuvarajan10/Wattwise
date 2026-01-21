/**
 * Firebase Configuration - DEMO MODE
 * Firebase is disabled for local testing
 */

// Create a mock auth object for demo mode
export const auth = {
    currentUser: {
        uid: 'demo-user-123',
        email: 'demo@wattwise.app',
        displayName: 'Demo User',
        getIdToken: async () => 'demo-token-for-testing'
    },
    onAuthStateChanged: (callback: any) => {
        // Immediately call with demo user
        setTimeout(() => {
            callback({
                uid: 'demo-user-123',
                email: 'demo@wattwise.app',
                displayName: 'Demo User'
            });
        }, 100);
        // Return unsubscribe function
        return () => { };
    }
};

// Mock Firestore (not used in demo mode)
export const db = {};

// Mock signOut function for demo mode
export const signOut = async (authInstance: any) => {
    // In demo mode, just resolve immediately
    return Promise.resolve();
};
