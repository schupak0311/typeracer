'use strict';

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bodyParser = require('body-parser');

const path = require('path');
const passport = require('passport');
const jwt = require('jsonwebtoken');

const users = require('./data/users');
const GameFlow = require('./models/GameFlow');

require('dotenv').config();
require('./passport.config');

server.listen(3000);

const gameFlow = new GameFlow({ io }); // Facade

app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/game.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/login.html'));
});

app.post('/login', (req, res) => {
    const loggingUser = req.body;
    const userInDB = users.find(user => {
        return user.email === loggingUser.email && user.password === loggingUser.password;
    });

    if (userInDB) {
        const token = jwt.sign(userInDB, 'secret');
        res.status(200).json({ auth: true, token });
    } else {
        res.status(401).json({ auth: false });
    }
});

app.get('/text', passport.authenticate('jwt', { session: false }), (req, res) => { // Secured path
    res.status(200).send({ text: gameFlow.getRaceText() }); // Using gameFlow Facade
});

io.on('connection', (socket) => {
    socket.join('waiting');
    socket.emit('waiting-countdown', { time: gameFlow.getWaitingCountdown() }); // Using gameFlow Facade

    // Using gameFlow Facade
    if (io.engine.clientsCount === 1) {
        gameFlow.startPlaying(); // Start if at least 1 user is connected
    }

    // Using gameFlow Facade
    socket.on('disconnect', () => {
        if (!io.engine.clientsCount) {
            gameFlow.stopPlaying(); // Reset everything if everyone disconnected
        }
    });
});