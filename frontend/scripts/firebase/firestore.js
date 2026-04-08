import { 
    collection, 
    query, 
    orderBy, 
    limit, 
    onSnapshot 
} from "firebase/firestore";

/**
 * ฟังก์ชันสำหรับฟังการเปลี่ยนแปลงข้อมูลแบบ Real-time
 * @param {Firestore} db - instance ของ firestore ที่ได้จาก initializeFirebase
 * @param {Function} callback - ฟังก์ชันที่จะทำงานเมื่อข้อมูลมีการเปลี่ยนแปลง
 */
export function listenToLiveStatus(db, callback) {
    // 1. ระบุ Collection ที่ต้องการ (ต้องชื่อตรงกับใน Firebase Console)
    const colRef = collection(db, "detection_logs");

    // 2. สร้าง Query: เรียงตามเวลาล่าสุด และเอามาแค่ 10 รายการล่าสุด
    const q = query(
        colRef, 
        orderBy("timestamp", "desc"), 
        limit(10)
    );

    // 3. เริ่มฟังการเปลี่ยนแปลง (Real-time Listener)
    // snapshot จะถูกส่งกลับไปทุกครั้งที่มีข้อมูลใหม่เพิ่มเข้ามา
    return onSnapshot(q, (snapshot) => {
        console.log("🔔 New data received from Firestore!");
        callback(snapshot);
    }, (error) => {
        console.error("❌ Firestore Subscription Error:", error);
    });
}