import { initializeFirebase } from './firebase/firebase-init.js';
import { listenToLiveStatus } from './firebase/firestore.js';
import { initDashboardUI } from './ui/dashboard.js';
import { renderHistoryTable } from './ui/history.js';

async function initApp() {
    console.log("🚀 System Starting...");

    // 1. ดึงฐานข้อมูลมาใช้งาน
    const db = initializeFirebase();

    // เช็คหน้าปัจจุบัน
    const path = window.location.pathname;
    const isHistoryPage = path.includes('history.html');
    const isUploadPage = path.includes('upload.html');

    // อ้างอิง Element บนหน้าจอ
    const statusBadge = document.getElementById("status-badge");
    const historyBody = document.getElementById("history-body");

    // ฟังก์ชันช่วยอัปเดตสถานะ ONLINE/OFFLINE
    const updateStatus = (isOnline) => {
        if (!statusBadge) return;
        statusBadge.textContent = isOnline ? "ONLINE" : "OFFLINE";
        statusBadge.style.backgroundColor = isOnline ? "#2ecc71" : "#e74c3c";
    };

    if (isHistoryPage) {
        renderHistoryTable(db);
    } else if (isUploadPage) {
        console.log("📤 Upload Page Ready");
    } else {
        // --- ส่วนของ Dashboard (หน้าหลัก) ---
        initDashboardUI();

        // 2. เรียกใช้ฟังก์ชันจาก firestore.js ที่คุณเตรียมไว้
        listenToLiveStatus(db, (snapshot) => {
            // ถ้าข้อมูลมาถึงตรงนี้ แปลว่าการเชื่อมต่อปกติดี
            updateStatus(true);

            if (historyBody) {
                historyBody.innerHTML = ""; // ล้างรายการเก่า

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const li = document.createElement("li");

                    // จัดหน้าตา Log ให้สวยงาม
                    li.style.padding = "12px";
                    li.style.marginBottom = "10px";
                    li.style.backgroundColor = "#333";
                    li.style.borderRadius = "8px";
                    li.style.borderLeft = "5px solid #ffc107";

                    li.innerHTML = `
                        <strong style="color: #ffc107;">${data.time || 'Unknown'}</strong> 
                        <span style="margin-left: 10px;">${data.status}</span>
                    `;

                    historyBody.appendChild(li);
                });
            }
        }, (error) => {
            console.error("❌ Connection Failed:", error);
            updateStatus(false);
        });
    }
}

document.addEventListener('DOMContentLoaded', initApp);