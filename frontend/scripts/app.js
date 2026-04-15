import { initializeFirebase } from './firebase/firebase-init.js';
import { listenToLiveStatus } from './firebase/firestore.js';
import { initDashboardUI, updateStatusUI } from './ui/dashboard.js';
import { renderHistoryTable } from './ui/history.js';

const BACKEND_URL = "http://localhost:8000";

async function initApp() {
    console.log("🚀 System Starting...");
    const db = initializeFirebase();

    const path = window.location.pathname;

    if (path.includes('history.html')) {
        renderHistoryTable(db);
        return;
    }

    // ---------- Dashboard page ----------

    initDashboardUI();

    // Polling live feed จาก /api/v1/frame (เสถียรกว่า MJPEG ใน <img>)
    const liveStream = document.getElementById("live-stream");
    if (liveStream) {
        liveStream.style.width = "100%";
        liveStream.style.height = "100%";
        liveStream.style.objectFit = "contain";

        const pollFrame = () => {
            liveStream.src = `${BACKEND_URL}/api/v1/frame?t=${Date.now()}`;
        };
        pollFrame();
        setInterval(pollFrame, 100); // ~10 FPS
    }

    // Firebase onSnapshot → อัปเดต UI แบบ real-time
    const historyBody = document.getElementById("history-body");

    listenToLiveStatus(db, (snapshot) => {
        // อัปเดต status badge จาก document ล่าสุด
        if (!snapshot.empty) {
            const latest = snapshot.docs[0].data();
            updateStatusUI(latest.status);
        } else {
            updateStatusUI('clear');
        }

        // อัปเดต recent logs ใน sidebar
        if (historyBody) {
            historyBody.innerHTML = "";
            snapshot.forEach((doc) => {
                const data = doc.data();
                const li = document.createElement("li");
                li.style.cssText = [
                    "display: flex",
                    "align-items: center",
                    "padding: 18px 25px",
                    "margin-bottom: 15px",
                    "background-color: #2b2b2b",
                    "border-radius: 15px",
                    `border-left: 6px solid ${statusColor(data.status)}`,
                    "list-style: none",
                ].join(";");

                li.innerHTML = `
                    <strong style="color: #ffc107; font-size: 1.1rem; margin-right: 20px;">
                        ${data.time || 'N/A'}
                    </strong>
                    <span style="color: #d1d1d1; font-size: 1rem;">${data.status}</span>
                `;
                historyBody.appendChild(li);
            });
        }
    });
}

function statusColor(status) {
    switch (status) {
        case 'leopard':  return '#dc3545';
        case 'domestic': return '#17a2b8';
        default:         return '#ffc107';
    }
}

document.addEventListener('DOMContentLoaded', initApp);
