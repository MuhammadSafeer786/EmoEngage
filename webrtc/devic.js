const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cv = require('opencv4nodejs');
const deepface = require('deepface');
const path = require('path');

const faceClassifier = new cv.CascadeClassifier(cv.HAAR_FRONTALFACE_DEFAULT);

let emotionData = {
    time: [],
    angry: [],
    disgust: [],
    fear: [],
    happy: [],
    sad: [],
    surprise: [],
    neutral: []
};

let startTime = Date.now();
const timeThreshold = 20000; // Total time threshold (in milliseconds)
const emotionInterval = 5000; // Time interval to capture emotions (in milliseconds)
const numEmotions = Math.floor(timeThreshold / emotionInterval); // Number of emotions to capture

function calculateAttentionScore() {
    let totalWeight = 0;
    for (let emotion in emotionData) {
        if (emotion !== 'time') {
            totalWeight += emotionData[emotion].reduce((sum, weight) => sum + weight, 0);
        }
    }
    return totalWeight;
}

function detectEmotion() {
    let emotionCount = 0;
    const camera = new cv.VideoCapture(0);

    while (true) {
        const frame = camera.read();
        if (frame.empty) {
            console.error('Error: Unable to capture frame');
            break;
        }

        const grayFrame = frame.bgrToGray();
        const faces = faceClassifier.detectMultiScale(grayFrame).objects;

        for (const [x, y, w, h] of faces) {
            const faceRoi = frame.getRegion(new cv.Rect(x, y, w, h));
            const results = deepface.analyze(faceRoi.getData(), { actions: ['emotion'] });
            for (const result of results) {
                const emotion = result.dominant_emotion;
                const attentionWeight = {
                    angry: 0.5,
                    disgust: 0.25,
                    fear: 0.25,
                    happy: 0.75,
                    sad: 0.35,
                    surprise: 1.0,
                    neutral: 0.15
                }[emotion] || 0;

                const currentTime = Date.now() - startTime;
                emotionData.time.push(currentTime);
                for (let key in emotionData) {
                    if (key !== 'time') {
                        if (key === emotion) {
                            emotionData[key].push(attentionWeight);
                        } else {
                            emotionData[key].push(0);
                        }
                    }
                }

                emotionCount++;
                return emotion;
            }
        }

        if (emotionCount >= numEmotions) {
            const totalWeight = calculateAttentionScore();
            const engagementStatus = totalWeight > 1500 ? 'Engaged' : 'Not Engaged';
            return engagementStatus;
        }

        new Promise(resolve => setTimeout(resolve, emotionInterval));
    }
}

function plotEmotionGraph() {
    if (emotionData.time.length === 0) {
        console.log('No data available for plotting');
        return;
    }

    const totalEmotionWeights = [];
    for (let i = 0; i < emotionData.time.length; i++) {
        let totalWeight = 0;
        for (let emotion in emotionData) {
            if (emotion !== 'time') {
                totalWeight += emotionData[emotion][i];
            }
        }
        totalEmotionWeights.push(totalWeight);
    }

    const { createCanvas } = require('canvas');
    const canvas = createCanvas(1000, 600);
    const ctx = canvas.getContext('2d');

    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    for (let i = 0; i < emotionData.time.length; i++) {
        ctx.lineTo(i * (canvas.width / (emotionData.time.length - 1)), canvas.height - (totalEmotionWeights[i] / Math.max(...totalEmotionWeights) * canvas.height));
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fillStyle = 'blue';
    ctx.fill();

    ctx.font = '16px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText('Total Emotion Weight over Time', 20, 30);
    ctx.fillText('Time (s)', canvas.width / 2 - 50, canvas.height - 20);
    ctx.fillText('Total Emotion Weight', 20, canvas.height - 20);

    const graphPath = path.join(__dirname, 'static', 'graph.png');
    const buffer = canvas.toBuffer('image/png');
    require('fs').writeFileSync(graphPath, buffer);
}

app.get('/', (req, res) => {
    plotEmotionGraph();
    const emotion = detectEmotion();
    res.render('index.html', { emotion });
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

http.listen(3000, () => {
    console.log('Server listening on port 3000');
});

const cv2 = require('opencv-js');

function genFrames() {
  const camera = new cv2.VideoCapture(0);
  while (true) {
    const [success, frame] = camera.read(); // Read a frame from the camera
    if (!success) {
      break;
    } else {
      // Encode the frame as JPEG
      const [ret, buffer] = cv2.imencode('.jpg', frame);
      const frameBytes = Buffer.from(buffer);
      yield `--frame\r\nContent-Type: image/jpeg\r\n\r\n${frameBytes}\r\n`;
    }
  }
}

app.get('/video_feed', (req, res) => {
  res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');
  res.flushHeaders();
  const frameGenerator = genFrames();
  const interval = setInterval(() => {
    const nextFrame = frameGenerator.next();
    if (nextFrame.done) {
      clearInterval(interval);
      res.end();
    } else {
      res.write(nextFrame.value);
    }
  }, 1000 / 30); // Emit at most 30 times per second
});

app.get('/get_engagement_status', (req, res) => {
  const totalWeight = calculateAttentionScore();
  const engagementStatus = totalWeight > 1.5 ? 'Engaged' : 'Not Engaged';
  res.send(engagementStatus);
});

const lastEmitTime = new Map();

io.on('connection', (socket) => {
  console.log('A client connected');

  const emitInterval = 1000 / 30; // Emit at most 30 times per second

  socket.on('frame_send', (imageData) => {
    const currentTime = Date.now();
    if (!lastEmitTime.has(socket.id) || currentTime - lastEmitTime.get(socket.id) >= emitInterval) {
      // Enough time has passed since the last emit
      console.log('Receiving...');
      socket.emit('img', imageData, true);
      lastEmitTime.set(socket.id, currentTime);
    } else {
      // Throttle the emit if it's too frequent
      console.log('Throttling image receive');
    }
  });
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

