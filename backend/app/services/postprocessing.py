import numpy as np

def postprocess(outputs, conf_threshold=0.5, iou_threshold=0.4):
    """
    จัดการผลลัพธ์ดิบจาก ONNX Model
    :param outputs: list ของ numpy arrays ที่ได้จาก session.run()
    :param conf_threshold: ค่าความเชื่อมั่นขั้นต่ำ (0.0 - 1.0)
    :param iou_threshold: ค่าการทับซ้อนสำหรับ NMS
    :return: list ของ detections และสถานะสรุป
    """
    predictions = np.squeeze(outputs[0]) # ลดมิติจาก [1, 84, 8400] -> [84, 8400]
    predictions = predictions.T # สลับแกนเพื่อให้แต่ละแถวคือ 1 detection [8400, 84]

    boxes = []
    scores = []
    class_ids = []

    # 1. กรองเฉพาะรายการที่มีค่าความเชื่อมั่นสูงกว่า Threshold
    for pred in predictions:
        # สมมติใช้ YOLOv8: 4 ค่าแรกคือ box (cx, cy, w, h) ที่เหลือคือ class scores
        score = np.max(pred[4:]) 
        if score > conf_threshold:
            # แปลง cx, cy, w, h -> x1, y1, x2, y2
            cx, cy, w, h = pred[0], pred[1], pred[2], pred[3]
            x1 = cx - w / 2
            y1 = cy - h / 2
            x2 = cx + w / 2
            y2 = cy + h / 2
            
            boxes.append([x1, y1, x2, y2])
            scores.append(score)
            class_ids.append(np.argmax(pred[4:]))

    # 2. ทำ Non-Maximum Suppression (NMS) เพื่อลบกล่องที่ซ้อนกัน
    # (ในขั้นตอนนี้มักใช้ cv2.dnn.NMSBoxes หรือเขียนฟังก์ชัน NMS เอง)
    indices = nms_simple(boxes, scores, iou_threshold)
    
    final_detections = []
    labels = ["leopard", "other_animal"] # ปรับตามลำดับ Class ในโมเดลคุณ

    for i in indices:
        final_detections.append({
            "label": labels[class_ids[i]],
            "confidence": float(scores[i]),
            "box": {
                "x1": float(boxes[i][0]),
                "y1": float(boxes[i][1]),
                "x2": float(boxes[i][2]),
                "y2": float(boxes[i][3])
            }
        })

    # สรุปสถานะเพื่อส่งให้ Frontend
    status = "leopard" if any(d['label'] == "leopard" for d in final_detections) else "detecting"
    
    return final_detections, status

def nms_simple(boxes, scores, threshold):
    """ฟังก์ชัน NMS แบบง่าย (ลดรูป)"""
    if not boxes: return []
    # ในการใช้งานจริง แนะนำให้ใช้ cv2.dnn.NMSBoxes จะแม่นยำและเร็วกว่า
    return range(len(boxes)) # ส่งคืน index ทั้งหมดไปก่อนเพื่อทดสอบ