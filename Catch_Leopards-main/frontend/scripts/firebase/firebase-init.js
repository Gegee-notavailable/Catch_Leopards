import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCk4DZ-lifTpMDe0ntomtuSfHtvwsvEljQ",
    authDomain: "catch-leopards.firebaseapp.com",
    projectId: "catch-leopards",
    storageBucket: "catch-leopards.firebasestorage.app",
    messagingSenderId: "995564261043",
    appId: "1:995564261043:web:cf8d90aadd63d8d76aaac6",
    measurementId: "G-B4Z8F7NMCP"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const initializeFirebase = () => db;
