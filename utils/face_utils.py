"""
utils/face_utils.py
Pure utility functions for face recognition math.
No Flask or DB dependencies — safe to import anywhere.
"""
import math
import os


FACE_MATCH_THRESHOLD = float(os.environ.get("FACE_MATCH_THRESHOLD", 0.5))


def calculate_match_percentage(distance: float, threshold: float = FACE_MATCH_THRESHOLD) -> float:
    """
    Maps a raw face-recognition distance (0.0 = identical, 1.0 = completely different)
    to a human-readable match percentage (0–100 %).

    Matches (distance < threshold) are scaled to 85–100 %.
    Non-matches are scaled to 0–85 % for display only.
    """
    if distance > threshold:
        return max(0.0, round((1.0 - distance) * 100, 2))
    else:
        range_val = threshold
        linear_val = (threshold - distance) / range_val if range_val > 0 else 0
        return round(85.0 + (linear_val * 15.0), 2)


def compute_ear(eye_points: list) -> float:
    """
    Compute Eye Aspect Ratio (EAR) from 6 eye landmark points.
    EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)

    A low EAR value (< 0.22) indicates a blink.
    """
    def dist(p1, p2):
        return math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

    A = dist(eye_points[1], eye_points[5])
    B = dist(eye_points[2], eye_points[4])
    C = dist(eye_points[0], eye_points[3])
    return (A + B) / (2.0 * C) if C > 0 else 0.0
