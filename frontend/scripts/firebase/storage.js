import { db } from '../firebase/firebase-init.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { uploadDetectionImage } from '../firebase/storage.js';

// อ้างอิง Element จาก HTML
const imageInput = document.getElementById('image-input');
const statusInput = document.getElementById('status-input');
const uploadBtn = document.getElementById('upload-btn');
const progressDiv = document.getElementById('upload-progress');

/**
 * ฟังก์ชันหลักในการจัดการการส่งข้อมูล
 */
async function handleUpload() {
    const file = imageInput.files[0];
    const statusText = statusInput.value.trim();

    // 1. Validation: ตรวจสอบความพร้อมของข้อมูล
    if (!file) {
        alert("กรุณาเลือกรูปภาพก่อนครับ!");
        return;
    }
    if (!statusText) {
        alert("กรุณาใส่สถานะด้วยครับ!");
        return;
    }

    try {
        // เริ่มต้น Process
        uploadBtn.disabled = true;
        uploadBtn.innerText = "Processing...";
        progressDiv.innerText = "正在上传 (Uploading)...";

        // 2. อัปโหลดรูปไปที่ Firebase Storage (เรียกใช้ storage.js)
        const fileName = `manual_${Date.now()}_${file.name}`;
        const imageUrl = await uploadDetectionImage(file, fileName);

        // 3. บันทึกข้อมูลลง Firestore
        // หมายเหตุ: ใช้ serverTimestamp() เพื่อให้เวลาแม่นยำตาม Server
        await addDoc(collection(db, "detection_logs"), {
            status: statusText,
            imageUrl: imageUrl,
            timestamp: serverTimestamp(), 
            time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        });

        // 4. สำเร็จ!
        progressDiv.innerHTML = "<span style='color: #2ecc71;'>✅ Upload Success! Check your Dashboard.</span>";
        resetForm();

    } catch (error) {
        console.error("Upload failed:", error);
        progressDiv.innerHTML = "<span style='color: #e74c3c;'>❌ Error: " + error.message + "</span>";
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.innerText = "Upload to Cloud";
    }
}

function resetForm() {
    imageInput.value = "";
    statusInput.value = "";
}

// ผูก Event กับปุ่ม
if (uploadBtn) {
    uploadBtn.addEventListener('click', handleUpload);
}