import { collection, query, orderBy, getDocs } from "firebase/firestore";

/**
 * ฟังก์ชันสำหรับดึงข้อมูลประวัติทั้งหมดมาแสดงผลในตาราง
 * @param {Firestore} db - instance ของฐานข้อมูล
 */
export async function renderHistoryTable(db) {
    const historyBody = document.getElementById("history-table-body");
    if (!historyBody) return;

    try {
        console.log("📥 Fetching history data...");
        // 1. ดึงข้อมูลจาก Collection "detection_logs" เรียงตามเวลาล่าสุด
        const q = query(collection(db, "detection_logs"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        // 2. ล้างข้อมูลเก่าในตาราง
        historyBody.innerHTML = "";

        // 3. วนลูปสร้างแถวในตาราง
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement("tr");

            // ปรับแต่งหน้าตาแต่ละแถว
            row.innerHTML = `
                <td style="padding: 12px; border-bottom: 1px solid #444;">${data.time || 'N/A'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #444;">
                    <span style="color: #ffc107; font-weight: bold;">${data.status}</span>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #444; color: #888;">
                    ${data.timestamp ? new Date(data.timestamp.toDate()).toLocaleDateString() : '-'}
                </td>
            `;
            historyBody.appendChild(row);
        });

        console.log("✅ History table updated!");
    } catch (error) {
        console.error("❌ Error rendering history table:", error);
    }
}