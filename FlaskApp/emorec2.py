import cv2
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub

# Load a pre-trained gaze estimation model (e.g., from TensorFlow Hub)
model_url = "https://tfhub.dev/google/tf2-preview/mobilenet_v2/feature_vector/4"
gaze_model = tf.keras.Sequential([tf.keras.layers.Input(shape=(224, 224, 3)),
                                  hub.KerasLayer(model_url, trainable=False)])

# Load face detection model (e.g., Haarcascades or MTCNN)
face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')


def estimate_gaze(frame):
    # Detect faces in the frame
    gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(
        gray_frame, scaleFactor=1.1, minNeighbors=5)

    for (x, y, w, h) in faces:
        face_roi = frame[y:y+h, x:x+w]
        face_roi = cv2.resize(face_roi, (224, 224))
        face_roi = cv2.cvtColor(face_roi, cv2.COLOR_BGR2RGB)
        face_roi = tf.image.convert_image_dtype(face_roi, dtype=tf.float32)
        face_roi = tf.expand_dims(face_roi, axis=0)

        # Get gaze estimation
        gaze_vector = gaze_model.predict(face_roi)
        # Process the gaze vector as needed (e.g., thresholding, mapping to screen coordinates)

        # Display gaze estimation on the frame
        cv2.putText(frame, f"Gaze: {gaze_vector[0]}", (x, y - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
        cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

    return frame


# Capture video from webcam
cap = cv2.VideoCapture(0)
while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = estimate_gaze(frame)
    cv2.imshow("Gaze Estimation", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
