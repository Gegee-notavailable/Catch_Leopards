import { initializeFirebase } from './firebase/firebase-init.js';
import { listenToLiveStatus } from './firebase/firestore.js';
import { initDashboardUI } from './ui/dashboard.js';
import { renderHistoryTable } from './ui/history.js';
import { postprocess } from './utils/model-helper.js';

let modelSession = null;

async function initApp() {
    console.log("🚀 System Starting...");
    const db = initializeFirebase();

    // ดึง Element มารอไว้ก่อน
    const historyBody = document.getElementById("history-body");

    // 1. โหลดโมเดล (ตรวจสอบ Path ให้ตรงกับโฟลเดอร์ models ใน VS Code)
    try {
        // ใช้ Path สัมพัทธ์จากหน้า HTML
        modelSession = await ort.InferenceSession.create('./models/catch_leopards.onnx');
        console.log("🧠 ML Model Loaded!");
    } catch (e) {
        console.error("❌ Failed to load model:", e);
    }

    const path = window.location.pathname;
    const isHistoryPage = path.includes('history.html');

    if (isHistoryPage) {
        renderHistoryTable(db);
    } else {
        initDashboardUI();
        // ดึงข้อมูล Real-time มาแสดงผลใน Dashboard
        listenToLiveStatus(db, (snapshot) => {
            if (historyBody) {
                historyBody.innerHTML = "";
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    const li = document.createElement("li");

                    // จัดสไตล์ตามที่พี่ออกแบบไว้ในรูป
                    li.style.display = "flex";
                    li.style.alignItems = "center";
                    li.style.padding = "18px 25px";
                    li.style.marginBottom = "15px";
                    li.style.backgroundColor = "#2b2b2b";
                    li.style.borderRadius = "15px";
                    li.style.borderLeft = "6px solid #ffc107";
                    li.style.listStyle = "none";

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
        });
    }
}

/**
 * ฟังก์ชันประมวลผลรูปภาพ
 */
async function runDetection(imageElement, db) {
    if (!modelSession || videoElement.readyState < 2) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 640;

    // ตรวจสอบว่ารูปโหลดเสร็จหรือยังก่อนวาด
    ctx.drawImage(imageElement, 0, 0, 640, 640);
    const imageData = ctx.getImageData(0, 0, 640, 640);

    const { data } = imageData;
    const input = new Float32Array(1 * 3 * 640 * 640);

    // Normalize ข้อมูลตามที่เพื่อนบอก (pixel / 255.0)
    for (let i = 0; i < data.length / 4; i++) {
        input[i] = data[i * 4] / 255.0;
        input[i + 640 * 640] = data[i * 4 + 1] / 255.0;
        input[i + 2 * 640 * 640] = data[i * 4 + 2] / 255.0;
    }

    const tensorIn = new ort.Tensor('float32', input, [1, 3, 640, 640]);

    try {
        const outputs = await modelSession.run({ images: tensorIn }); // 'images' ต้องตรงกับ Input Node Name

        // ส่งผลลัพธ์ไปแกะข้อมูล
        const results = postprocess(outputs.output0, imageElement.width, imageElement.height, 1, 0, 0);

        const leopard = results.find(d => d.className === "leopard");
        if (leopard) {
            const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js");
            // บันทึกสถานะ "Leopard Detected!" เพื่อให้ Dashboard เปลี่ยนสีตามเงื่อนไข
            await addDoc(collection(db, "detections"), {
                status: "Leopard Detected!",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                date: new Date().toLocaleDateString(),
                timestamp: new Date()
            });
            console.log("🎯 Leopard Found and Logged!");
        }
    } catch (err) {
        console.error("❌ Runtime Error:", err);
    }
}

async function startLiveFeed() {
    const videoElement = document.getElementById("live-video"); // ต้องไปเติม id นี้ใน html นะพี่

    try {
        // ขออนุญาตใช้กล้อง
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 640 },
            audio: false
        });

        videoElement.srcObject = stream;
        videoElement.play();

        // พอเปิดกล้องได้แล้ว ก็สั่งให้วนลูปดีเทคทุกๆ 1 วินาที (หรือตามที่พี่ไหว)
        setInterval(() => {
            runDetection(videoElement, db);
        }, 1000);

    } catch (err) {
        console.error("❌ กล้องเปิดไม่ได้:", err);
    }
}

document.addEventListener('DOMContentLoaded', initApp);