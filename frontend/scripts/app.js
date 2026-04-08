import { initializeFirebase } from './firebase/firebase-init.js';
import { listenToLiveStatus } from './firebase/firestore.js';
import { initDashboardUI, updateStatusUI } from './ui/dashboard.js';
import { renderHistoryTable } from './ui/history.js';

async function initApp() {
    console.log("🚀 System Starting...");

    const db = initializeFirebase();

    const path = window.location.pathname;
    const isHistoryPage = path.includes('history.html');
    const isUploadPage = path.includes('upload.html');

    if (isHistoryPage) {
        console.log("📄 Loading History Page...");
        renderHistoryTable(db);

    } else if (isUploadPage) {
        console.log("📤 Loading Upload Page...");

    } else {
        console.log("📺 Loading Live Dashboard...");

        initDashboardUI();

        listenToLiveStatus(db, (data) => {
            updateStatusUI(data.status);
        });
    }
}

document.addEventListener('DOMContentLoaded', initApp);