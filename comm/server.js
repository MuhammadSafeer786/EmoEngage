const fs = require('fs');
const https = require('https')
const express = require('express');
const app = express();
const socketio = require('socket.io');





// app.use(express.static(__dirname));
// app.get('/', (req, res) => {
//     res.sendFile(__dirname + '/index.html', (err) => {
//         if (err) {
//             console.error('Error sending file: ', err);
//             res.status(500).send('Internal Server Error');  
//         }
//     });
// });




const key = fs.readFileSync('cert.key');
const cert = fs.readFileSync('cert.crt');

const expressServer = https.createServer({ key, cert }, app);
const io = socketio(expressServer, {
    cors: {
        origin: [
            "https://localhost",
            "https://localhost:8181",
            "https://localhost:8080"
            // 'https://192.168.18.117'
        ],
        methods: ["GET", "POST"]
    }
});
expressServer.listen(8080);



io.on('connection', (socket) => {
    console.log('Client connected');

    let lastEmitTime = 0;
    const emitInterval = 1000 / 30;

    socket.on('frame_send1', (imageData) => {
        const currentTime = Date.now();
        if (currentTime - lastEmitTime >= emitInterval) {
            // Enough time has passed since the last emit
            io.emit('img1', imageData);

            lastEmitTime = currentTime;
            console.log('Sending...');
        } else {
            // Throttle the emit if it's too frequent
            console.log('Throttling image emit');
        }
    });
    // socket.on('frame_send2', (imageData) => {
    //     const currentTime = Date.now();
    //     if (currentTime - lastEmitTime >= emitInterval) {
    //         // Enough time has passed since the last emit
    //         io.emit('img2', imageData);
    //         lastEmitTime = currentTime;
    //         console.log('Sending2222...');
    //     } else {
    //         // Throttle the emit if it's too frequent
    //         console.log('Throttling image emit22222');
    //     }
    // });
});
