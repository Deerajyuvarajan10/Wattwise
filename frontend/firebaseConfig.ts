import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyC8-d-AVOeyRbvB8QnEjhKEY-si6YR4UQI",
    authDomain: "wattwise-e986c.firebaseapp.com",
    projectId: "wattwise-e986c",
    storageBucket: "wattwise-e986c.firebasestorage.app",
    messagingSenderId: "1027569019680",
    appId: "1:1027569019680:web:0e74806c119e2782f40545",
    measurementId: "G-42PNX5VBCZ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
