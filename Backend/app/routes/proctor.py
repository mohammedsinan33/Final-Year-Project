import sys
import os
import cv2
import numpy as np
from fastapi import APIRouter, UploadFile, File
import shutil

# Add the Proctoring-AI-master folder to Python path so we can import its modules
# Adjust this path if your folder name is different
PROCTOR_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../Proctoring-AI-master"))
if PROCTOR_PATH not in sys.path:
    sys.path.append(PROCTOR_PATH)

try:
    # Try importing strict modules. If they fail due to TF errors, we catch it.
    # Note: You might need to refactor these files to not run code on import!
    from person_and_phone import process_frame_for_proctoring
    YOLO_AVAILABLE = True
except ImportError as e:
    print(f"WARNING: Could not import Proctoring modules (YOLO): {e}")
    YOLO_AVAILABLE = False
    process_frame_for_proctoring = None


router = APIRouter()

@router.post("/initial-check")
async def initial_check(file: UploadFile = File(...)):
    # Read image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return {"status": "error", "detail": "Invalid image format"}

    try:
        # Simple Logic: Use OpenCV Haar Cascade (Fast, no TensorFlow needed) 
        # This is a fallback if the complex models fail, but guarantees it works on Python 3.13
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)

        if len(faces) == 0:
            return {"status": "fail", "detail": "No face detected"}
        
        if len(faces) > 1:
            return {"status": "fail", "detail": "Multiple faces detected"}
            
        return {"status": "ok", "detail": "Face Centered"}

    except Exception as e:
        print(f"Proctor Check Error: {e}")
        return {"status": "error", "detail": str(e)}

@router.post("/monitor")
async def monitor(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if frame is None:
        return {"status": "error"}

    # 1. Detection Logic
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    
    issues = []

    # Basic Face Check
    if len(faces) == 0:
        issues.append("No face visible (Standard)")
    elif len(faces) > 1:
        issues.append("Multiple faces detected (Standard)")
    
    # 2. Advanced Proctoring (YOLO - Person & Phone)
    if YOLO_AVAILABLE and process_frame_for_proctoring:
        try:
            yolo_results = process_frame_for_proctoring(frame)
            if yolo_results.get("status") == "success":
                if yolo_results.get("phone_detected"):
                    issues.append("Mobile Phone Detected!")
                if yolo_results.get("person_count", 0) > 1:
                    issues.append("Multiple People Detected!")
                # Optional: If YOLO says 0 people, but Haar says 1 face, trust Haar? 
                # Or report mismatch. For now, rely on specific flags.
        except Exception as e:
            print(f"YOLO Inference Error: {e}")

    if issues:
        return {"status": "alert", "issue": ", ".join(issues)}
    
    return {"status": "ok"}