# EmoEngage
Welcome to EmoEngage that is a Web App made for our Final Year Project. It can not only create a simple 2 person meeting but also send the video stream to another app that uses AI for getting emotions from attendants faces and conclude whether they were attentive or not and how much of the time they remained attentive.

# Contributors
Maratib Ali     --> https://github.com/Maratib-634 & Muhammad Usman  --> https://github.com/UsmanSiddiqui20

# Algorithm Explanation

This project was a research based project so we applied 3 main strategies to find whether the participants were engaged or not. First one "app.py" uses weighted emotions to predict engagement, Second one "app2.py" uses orientation of head to determine whether the participant is looking towards the screen or not, and the Third one "app3.py" return 'Engaged' on positive emotions and 'Not Engaged' on negative emotions.
# Note
This repository have 2 apps. One developed in node.js for the creation of meeting and another in flask python for Machine Learing part.

Use Pyhton 3.9.10 for this project. Other requirments for flask app are listed in EmoEngage/requirements.txt

# Follow these instructions to run it.

1. Open 3 Terminals or CMD at once.
2. Navigate to folders Comm, EmoEngage, WebRTC using the the terminals you just opened using cd command 'For Windows & Maybe for Linux too' e.g.
```shell
cd Path\to\Comm
```
```shell
cd Path\to\WebRTC
```
```shell
cd Path\to\EmoEngage
```
3. In the terminal of \WebRTC run:
```shell
npm install
```
```shell
npm run start
```
4. In the terminal of \comm run:
```shell
npm install
```
```shell
node server.js
```
5. In your browser go to the site:

# Please take special care of http or https in the following urls.

```shell
https://localhost:8181
```
6. open app.py or app2.py or app3.py depending on which algorithm you want to use. Open these files in any IDE.
7. In your browser go to either of the following sites depending upon which app.py you opened "Check the Code": 
```shell
http://localhost:5000
```
OR maybe 
```shell
http://localhost:3000
```
