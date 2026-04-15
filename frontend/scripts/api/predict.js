const API_URL = "http://localhost:8000/api/v1/predict";

/**
 * ส่งรูปภาพไปให้ Backend ตรวจจับ แล้วคืนค่าผลลัพธ์
 * @param {File} imageFile - ไฟล์รูปที่ user เลือก
 * @returns {Promise<{status: string, message: string, detections: Array, count: number, processing_time: number}>}
 */
export async function predictImage(imageFile) {
    const formData = new FormData();
    formData.append("file", imageFile);

    const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${response.status}`);
    }

    return response.json();
}
