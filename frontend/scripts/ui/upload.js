import { initializeFirebase } from '../firebase/firebase-init.js';
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { uploadDetectionImage } from '../firebase/storage.js';

// 1. ดึง Instance ของฐานข้อมูล
const db = getFirestore(initializeFirebase());

// 2. อ้างอิง HTML Elements
const imageInput = document.getElementById('image-input');
const statusInput = document.getElementById('status-input');
const uploadBtn = document.getElementById('upload-btn');
const progressDiv = document.getElementById('upload-progress');

/**
 * ฟังก์ชันหลักในการอัปโหลดข้อมูลตรวจจับ
 */
async function handleUpload() {
    const file = imageInput.files[0];
    const statusText = statusInput.value.trim();

    // ตรวจสอบความพร้อมของข้อมูลก่อนส่ง
    if (!file) {
        showStatus("❌ กรุณาเลือกรูปภาพหลักฐานก่อนครับ", "red");
        return;
    }
    if (!statusText) {
        showStatus("❌ กรุณาใส่สถานะการตรวจจับ (เช่น Leopard Detected!)", "red");
        return;
    }

    try {
        // เริ่มต้นกระบวนการ (ปิดปุ่มเพื่อป้องกันการกดซ้ำ)
        setLoading(true);
        showStatus("⏳ กำลังอัปโหลดรูปภาพไปยัง Cloud Storage...", "#ffc107");

        // --- Step 1: อัปโหลดรูปไปที่ Firebase Storage ---
        // ใช้ชื่อไฟล์แบบ Timestamp เพื่อป้องกันชื่อซ้ำ
        const fileName = `manual_upload_${Date.now()}_${file.name}`;
        const imageUrl = await uploadDetectionImage(file, fileName);

        showStatus("💾 กำลังบันทึกข้อมูลลง Database...", "#ffc107");

        // --- Step 2: บันทึกข้อมูลลงใน Firestore ---
        await addDoc(collection(db, "detection_logs"), {
            status: statusText,
            imageUrl: imageUrl, // URL ที่ได้จาก Storage
            timestamp: serverTimestamp(), // เวลาจริงจาก Server
            time: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        });

        // --- Step 3: เสร็จสมบูรณ์ ---
        showStatus("✅ อัปโหลดสำเร็จ! รายการจะไปโผล่ที่หน้า Dashboard ทันที", "#2ecc71");
        resetForm();

    } catch (error) {
        console.error("Upload process failed:", error);
        showStatus(`❌ เกิดข้อผิดพลาด: ${error.message}`, "#dc3545");
    } finally {
        setLoading(false);
    }
}

/**
 * ฟังก์ชันช่วยจัดการสถานะปุ่ม Loading
 */
function setLoading(isLoading) {
    if (isLoading) {
        uploadBtn.disabled = true;
        uploadBtn.innerText = "Processing...";
    } else {
        uploadBtn.disabled = false;
        uploadBtn.innerText = "Upload to Cloud";
    }
}

/**
 * ฟังก์ชันแสดงข้อความสถานะบนหน้าจอ
 */
function showStatus(message, color) {
    if (progressDiv) {
        progressDiv.innerText = message;
        progressDiv.style.color = color;
        progressDiv.style.marginTop = "15px";
        progressDiv.style.fontWeight = "bold";
    }
}

/**
 * ล้างข้อมูลในฟอร์มหลังจากส่งเสร็จ
 */
function resetForm() {
    imageInput.value = "";
    statusInput.value = "";
}

// ผูกเหตุการณ์การคลิกกับปุ่ม
if (uploadBtn) {
    uploadBtn.addEventListener('click', handleUpload);
}