import { initializeFirebase } from './firebase/firebase-init.js';
import { listenToLiveStatus } from './firebase/firestore.js';
import { initDashboardUI } from './ui/dashboard.js';
import { renderHistoryTable } from './ui/history.js';

// โหลดฟอนต์ที่ดูแกร่งขึ้น (Roboto Slab) มาใช้
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@400;700&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

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

        // 2. เรียกใช้ฟังก์ชันจาก firestore.js
        listenToLiveStatus(db, (snapshot) => {
            updateStatus(true);

            if (historyBody) {
                historyBody.innerHTML = ""; // ล้างรายการเก่าออกก่อน

                // ตั้งฟอนต์หลักให้หน้า Dashboard
                historyBody.style.fontFamily = "'Roboto Slab', serif";

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const li = document.createElement("li");

                    // --- ปรับสไตล์ของแต่ละแถวให้ตรงตามรูป ---
                    li.style.display = "flex";
                    li.style.justifyContent = "flex-start"; // ชิดซ้ายทั้งหมด
                    li.style.alignItems = "center";
                    li.style.padding = "18px 25px"; // ปรับ padding ให้ได้ระยะ
                    li.style.marginBottom = "15px";
                    
                    // ปรับสีพื้นหลังให้สว่างขึ้น (สีเทาเข้ม) และมุมมนชัดเจน
                    li.style.backgroundColor = "#2b2b2b"; 
                    li.style.borderRadius = "15px"; 
                    
                    // เส้นสีเหลืองด้านซ้ายหนาขึ้น
                    li.style.borderLeft = "6px solid #ffc107";
                    li.style.listStyle = "none"; // เอาจุดหน้า list ออก

                    // --- สลับสีข้อความตามรูป ---
                    li.innerHTML = `
                        <strong style="color: #ffc107; font-size: 1.1rem; margin-right: 20px;">
                            ${data.time || 'N/A'}
                        </strong> 
                        
                        <span style="color: #d1d1d1; font-size: 1rem;">
                            ${data.status}
                        </span>
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