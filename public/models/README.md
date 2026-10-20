# Verification models

These files power the on-device face capture and liveness checks on the seller
verification page. They are served as static assets and are never sent to a
third party.

- `face_landmarker.task` — MediaPipe Face Landmarker, Apache-2.0.
  Source: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task
- `face-antispoof.onnx` — MiniFAS quantized face anti-spoofing model, Apache-2.0.
  Source: https://github.com/facenox/face-antispoof-onnx

The anti-spoofing model is a risk signal, not a certified liveness product.
Manual admin review remains the final decision for high-risk verifications.
