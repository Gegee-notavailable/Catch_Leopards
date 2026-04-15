// scripts/utils/model-helper.js

export const classNames = ["cat", "cow", "dog", "goat", "leopard"];

/**
 * ฟังก์ชัน Post-process ที่เพื่อนส่งมา
 */
export function postprocess(output, origWidth, origHeight, ratio, padX, padY) {
    const data = output.data; 
    const numAnchors = 8400;
    const numClasses = 5;
    const confThreshold = 0.25;
    const detections = [];

    for (let i = 0; i < numAnchors; i++) {
        let maxScore = 0;
        let maxClass = 0;

        for (let c = 0; c < numClasses; c++) {
            const score = data[(4 + c) * numAnchors + i];
            if (score > maxScore) {
                maxScore = score;
                maxClass = c;
            }
        }

        if (maxScore < confThreshold) continue;

        const cx = data[0 * numAnchors + i];
        const cy = data[1 * numAnchors + i];
        const w  = data[2 * numAnchors + i];
        const h  = data[3 * numAnchors + i];

        let x1 = (cx - w / 2 - padX) / ratio;
        let y1 = (cy - h / 2 - padY) / ratio;
        let x2 = (cx + w / 2 - padX) / ratio;
        let y2 = (cy + h / 2 - padY) / ratio;

        detections.push({
            className: classNames[maxClass],
            confidence: maxScore,
            bbox: [Math.max(0, x1), Math.max(0, y1), x2, y2]
        });
    }
    return detections;
}