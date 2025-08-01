
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    projectId: "organizador-de-clientes-knmjh",
    appId: "1:597370116180:web:ef43d892ec72946a1a35c1",
    storageBucket: "organizador-de-clientes-knmjh.firebasestorage.app",
    apiKey: "AIzaSyAcJSOxyIFFIc5sISE7pjV0hxr2uwhLv2U",
    authDomain: "organizador-de-clientes-knmjh.firebaseapp.com",
    measurementId: "",
    messagingSenderId: "597370116180"
};

// Initialize Firebase
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
