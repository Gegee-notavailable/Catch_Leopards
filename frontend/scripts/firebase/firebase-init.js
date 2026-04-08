import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
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

// 1. ต้อง InitializeApp ก่อนเป็นอันดับแรก
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. แล้วค่อยเอา app ที่สร้างเสร็จแล้วมาใส่ใน getFirestore
const db = getFirestore(app);

// 3. ส่งออกไปใช้งาน
export const initializeFirebase = () => db;