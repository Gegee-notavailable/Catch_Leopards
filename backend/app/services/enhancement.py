import cv2
import numpy as np


def apply_clahe(frame: np.ndarray) -> np.ndarray:
    """CLAHE บน L-channel ของ LAB — เพิ่ม contrast โดยไม่กระทบสี"""
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    lab = cv2.merge([clahe.apply(l), a, b])
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def _dark_channel(image_f: np.ndarray, patch_size: int = 15) -> np.ndarray:
    min_channel = np.min(image_f, axis=2)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (patch_size, patch_size))
    return cv2.erode(min_channel, kernel)


def _atmospheric_light(image_f: np.ndarray, dark: np.ndarray) -> np.ndarray:
    flat_dark = dark.flatten()
    n = max(int(flat_dark.size * 0.001), 1)
    indices = np.argpartition(flat_dark, -n)[-n:]
    flat_img = image_f.reshape(-1, 3)
    return np.max(flat_img[indices], axis=0)


def apply_defog(frame: np.ndarray, omega: float = 0.95, t0: float = 0.1) -> np.ndarray:
    """Dark Channel Prior Defogging — ลดหมอก/ฝน/ฝุ่นในภาพ"""
    image_f = frame.astype(np.float64) / 255.0
    dark = _dark_channel(image_f)
    atm = _atmospheric_light(image_f, dark)

    norm = image_f / (atm + 1e-6)
    transmission = 1.0 - omega * _dark_channel(norm)
    t = np.maximum(transmission[:, :, np.newaxis], t0)

    recovered = (image_f - atm) / t + atm
    return np.clip(recovered * 255, 0, 255).astype(np.uint8)


def enhance_frame(frame: np.ndarray) -> np.ndarray:
    """Pipeline: CLAHE → Defogging"""
    frame = apply_clahe(frame)
    frame = apply_defog(frame)
    return frame
