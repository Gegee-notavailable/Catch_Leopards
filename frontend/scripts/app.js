import { initializeFirebase } from './firebase/firebase-init.js';
import { listenToLiveStatus } from './firebase/firestore.js';
import { initDashboardUI } from './ui/dashboard.js';
import { renderHistoryTable } from './ui/history.js';
import { postprocess } from './utils/model-helper.js';

let modelSession = null;
let db = null; // ย้ายมาไว้นี่เพื่อให้ทุกฟังก์ชันใช้ได้

async function initApp() {
    console.log("🚀 System Starting...");
    db = initializeFirebase(); // กำหนดค่าให้ db
    const streamImg = document.getElementById('live-stream');
    const historyBody = document.getElementById("history-body");

    // 1. โหลดโมเดล
    try {
        modelSession = await ort.InferenceSession.create('./models/catch_leopards.onnx');
        console.log("🧠 ML Model Loaded!");
    } catch (e) {
        console.error("❌ Failed to load model:", e);
    }

    // 2. ตรวจจับภาพจาก IP Webcam (มือถือ) ทุก 1 วินาที
    setInterval(async () => {
        // เช็คว่ารูปจาก IP Webcam โหลดมาหรือยัง
        if (streamImg && streamImg.complete && streamImg.naturalWidth !== 0) {
            await runDetection(streamImg);
        }
    }, 1000);

    // 3. จัดการหน้าจอ UI
    const path = window.location.pathname;
    if (path.includes('history.html')) {
        renderHistoryTable(db);
    } else {
        initDashboardUI();
        listenToLiveStatus(db, (snapshot) => {
            if (historyBody) {
                historyBody.innerHTML = "";
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const li = document.createElement("li");
                    // ... (สไตล์ที่พี่เขียนไว้ ดีแล้วครับ) ...
                    li.innerHTML = `<strong>${data.time || 'N/A'}</strong> <span>${data.status}</span>`;
                    historyBody.appendChild(li);
                });
            }
        });
    }
}

async function runDetection(sourceElement) {
    if (!modelSession) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 640;

    ctx.drawImage(sourceElement, 0, 0, 640, 640);
    const imageData = ctx.getImageData(0, 0, 640, 640);
    const { data } = imageData;
    const input = new Float32Array(1 * 3 * 640 * 640);

    for (let i = 0; i < data.length / 4; i++) {
        input[i] = data[i * 4] / 255.0;
        input[i + 640 * 640] = data[i * 4 + 1] / 255.0;
        input[i + 2 * 640 * 640] = data[i * 4 + 2] / 255.0;
    }

    const tensorIn = new ort.Tensor('float32', input, [1, 3, 640, 640]);

    try {
        const outputs = await modelSession.run({ images: tensorIn });
        const results = postprocess(outputs.output0, sourceElement.width || 640, sourceElement.height || 640, 1, 0, 0);

        const leopard = results.find(d => d.className === "leopard");
        if (leopard) {
            const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");
            await addDoc(collection(db, "detections"), {
                status: "Leopard Detected!",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                date: new Date().toLocaleDateString(),
                timestamp: new Date()
            });
            console.log("🎯 Leopard Found!");
        }
    } catch (err) {
        console.error("❌ Runtime Error:", err);
    }
}

document.addEventListener('DOMContentLoaded', initApp);