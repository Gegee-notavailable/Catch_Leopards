import numpy as np
import cv2

# class ที่ถือเป็นเสือดาว
LEOPARD_KEYWORDS = ['leopard', 'panther', 'jaguar', 'tiger']

def is_leopard(class_name):
    name = class_name.lower()
    return any(kw in name for kw in LEOPARD_KEYWORDS)


def postprocess(outputs, class_names, conf_threshold=0.5, iou_threshold=0.4):
    """แปลง output ดิบจาก YOLO เป็น list ของ detections"""
    predictions = np.squeeze(outputs[0]).T  # [N, 4+nc]

    boxes_xywh, boxes_xyxy, scores, class_ids = [], [], [], []

    for pred in predictions:
        cls_scores = pred[4:]
        score = float(np.max(cls_scores))
        if score > conf_threshold:
            cx, cy, w, h = pred[0], pred[1], pred[2], pred[3]
            x1, y1 = cx - w / 2, cy - h / 2
            boxes_xywh.append([x1, y1, w, h])   # สำหรับ NMSBoxes ([x, y, w, h])
            boxes_xyxy.append([x1, y1, x1 + w, y1 + h])  # สำหรับ output ([x1, y1, x2, y2])
            scores.append(score)
            class_ids.append(int(np.argmax(cls_scores)))

    if not boxes_xywh:
        return [], "clear"

    # NMS จริง ใช้ของ OpenCV
    indices = cv2.dnn.NMSBoxes(boxes_xywh, scores, conf_threshold, iou_threshold)

    detections = []
    if len(indices) > 0:
        for i in np.array(indices).flatten():
            cls_id = class_ids[i]
            label = class_names[cls_id] if cls_id < len(class_names) else f"class_{cls_id}"
            detections.append({
                "label": label,
                "confidence": float(scores[i]),
                "box": {
                    "x1": float(boxes_xyxy[i][0]),
                    "y1": float(boxes_xyxy[i][1]),
                    "x2": float(boxes_xyxy[i][2]),
                    "y2": float(boxes_xyxy[i][3])
                }
            })

    # สรุป status
    if any(is_leopard(d['label']) for d in detections):
        status = "leopard"
    elif detections:
        status = "domestic"
    else:
        status = "clear"

    return detections, status