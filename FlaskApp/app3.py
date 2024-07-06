import base64
import socketio
import threading
import matplotlib.pyplot as plt
from flask import Flask, render_template, Response
import cv2
from deepface import DeepFace
import time
import numpy as np
import matplotlib
import tensorflow as tf
from keras.models import load_model
matplotlib.use('Agg')


app = Flask(__name__)

video_frames = []
sio = socketio.Client(ssl_verify=False)
lock = threading.Lock()


@sio.event
def connect():
    print('Connected to server')


@sio.on('img1')
def receive_image(data):
    image_bytes = base64.b64decode(data.split(",")[1])
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    with lock:
        video_frames.append(img)


def run_client():
    sio.connect('https://localhost:8080')
    sio.wait()


def calculate_attention_score():
    total_weight = 0
    for key, value in emotion_data.items():
        if key != 'time':
            total_weight += sum(value)
    return total_weight


def get_next_frame():
    with lock:
        if video_frames:
            return True, video_frames.pop(0)
        else:
            return False, None


face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
######################################
######################################
# engagement_labels = ['Not Engaged', 'Engaged']
# face_cascade2 = cv2.CascadeClassifier(
#     cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
######################################
######################################
emotion_data = {'time': [], 'angry': [], 'disgust': [], 'fear': [],
                'happy': [], 'sad': [], 'surprise': [], 'neutral': []}
start_time = time.time()
time_threshold = 20
emotion_interval = 5
num_emotions = time_threshold // emotion_interval


# def calculate_attention_score():
#     total_weight = 0
#     for key, value in emotion_data.items():
#         if key != 'time':
#             total_weight += sum(value)
#     return total_weight


def detect_emotion():
    emotion_count = 0
    while True:
        ret, frame = get_next_frame()
        if not ret:
            continue

        gray_image = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(
            gray_image, scaleFactor=1.3, minNeighbors=5)
        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            face_roi = frame[y:y+h, x:x+w]
            results = DeepFace.analyze(
                face_roi, actions=['emotion'], enforce_detection=False)
            for result in results:
                global emotion
                emotion = result['dominant_emotion']
                attention_weight = {
                    'angry': 0.5,
                    'disgust': 0.25,
                    'fear': 0.25,
                    'happy': 0.75,
                    'sad': 0.35,
                    'surprise': 1.0,
                    'neutral': 0.15,
                }.get(emotion, 0)

                current_time = time.time() - start_time
                emotion_data['time'].append(current_time)
                for key in emotion_data.keys():
                    if key != 'time':
                        if key == emotion:
                            emotion_data[key].append(attention_weight)
                        else:
                            emotion_data[key].append(0)

                emotion_count += 1
                return emotion

        if emotion_count >= num_emotions:
            total_weight = calculate_attention_score()
            engagement_status = "Engaged" if total_weight > 1.5 else "Not Engaged"
            return engagement_status


def detect_enagement(emotion):
    attentive_emotions = ['happy', 'surprise', 'neutral']
    if emotion in attentive_emotions:
        return 'Engaged'
    else:
        return 'Not Engaged'


def plot_emotion_graph():
    if not emotion_data['time']:
        print("No data available for plotting")
        return

    total_emotion_weights = []
    dataEmotion = emotion_data["time"]
    print("plotting graph")
    print(dataEmotion)
    for i, time_point in enumerate(dataEmotion):
        total_weight = sum([emotion_data[emotion][i]
                           for emotion in emotion_data.keys() if emotion != 'time'])
        total_emotion_weights.append(total_weight)

    plt.figure(figsize=(10, 6))
    plt.plot(emotion_data['time'], total_emotion_weights,
             label='Total Emotion Weight', color='blue')
    plt.xlabel('Time (s)')
    plt.ylabel('Attention Level')
    plt.title('Total Attention Level over Time')
    plt.legend()
    plt.grid(True)
    plt.savefig('static/graph.png')
    plt.close()


@app.route('/')
def index():
    plot_emotion_graph()
    emotion = "calculating emotion..."
    return render_template('index2.html')


def generate_frames():
    while True:
        ret, frame = get_next_frame()
        if not ret:
            continue
        else:
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                frame = buffer.tobytes()
                yield (b'--frame\r\n' b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/get_engagement_status')
def get_engagement_status():
    emotion1 = detect_emotion()
    engagement_status = detect_enagement(emotion1)
    return engagement_status


@app.route('/get_emotion_status')
def get_emotion_status():
    emotion1 = detect_emotion()
    return emotion1


@app.route('/get_graph')
def get_graph():
    plot_emotion_graph()
    return "/static/graph.png"


if __name__ == '__main__':
    client_thread = threading.Thread(target=run_client)
    client_thread.daemon = True
    client_thread.start()
    app.run(host='localhost', port='4000', debug=True)
