'use strict';

const _ = require('lodash'); // Partial application (line 153)
const jwt = require('jsonwebtoken');
const prettyMs = require('pretty-ms');
const Commentator = require('./Commentator');

const TEXTS = require('../data/texts');
const CARS = ['Ferrari', 'Lamborghini', 'Corvette', 'Mercedes', 'Audi', 'BMW', 'Toyota', 'ZAZ 968M', 'VAZ 2101', 'Boeing AH-64 Apache'];

// Facade
class GameFlow {
    constructor({ io }) {
        this.io = io;
        this.currentText = GameFlow.getRandomItemFromArray(TEXTS);
        this.nextText = this.currentText;
        this.defaultPreRaceTime = 10;
        this.defaultWaitTime = 15;
        this.raceProcessStarted = false;

        this.resetCountdowns();
        this.commentator = new Commentator(io); // Using factory method of this object (Commentator also uses Proxy in the constructor)

        this.onDisconnect = this.onDisconnect.bind(this);
    }

    static getRandomItemFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    resetCountdowns() {
        this.defaultRaceTime = this.getRaceTime();
        this.defaultWaitingCountdown = this.defaultPreRaceTime + this.defaultRaceTime + this.defaultWaitTime;
        this.waitingCountdown = this.defaultPreRaceTime + this.defaultRaceTime + this.defaultWaitTime;
        this.preRaceCountdown = this.defaultPreRaceTime;
        this.racingCountdown = this.defaultRaceTime;
    };

    getRaceTime() {
        return Math.round(this.nextText.length);
    }

    startPlaying() {
        this.waitingCountdown = 7;
        this.io.to('waiting').emit('waiting-countdown', { time: this.getFormattedTime(this.waitingCountdown) });

        this.timer = setInterval(() => {
            this.waitingCountdown--;
            this.io.to('waiting').to('after-race').emit('waiting-countdown', { time: this.getFormattedTime(this.waitingCountdown) });

            if (this.waitingCountdown === 0) {
                this.prepareRace();
            }

            if (this.waitingCountdown >= this.defaultWaitingCountdown - this.defaultPreRaceTime) {
                if (this.preRaceCountdown === 0) {
                    this.startRace();
                } else {
                    this.io.to('racing').emit('pre-racing-countdown', { time: this.getFormattedTime(this.preRaceCountdown) });
                }

                this.preRaceCountdown--;
            }

            if (this.waitingCountdown <= this.defaultWaitingCountdown - this.defaultPreRaceTime &&
                this.waitingCountdown >= (this.defaultWaitingCountdown - (this.defaultPreRaceTime + this.defaultRaceTime))
            ) {
                if (this.racingCountdown === 0) {
                    this.stopRace();
                }
                this.io.to('racing').emit('racing-countdown', { time: this.getFormattedTime(this.racingCountdown) });

                this.racingCountdown--;
            }

            // Periodic message about the current state of the race
            if (this.racingCountdown !== this.defaultRaceTime && (this.defaultRaceTime - this.racingCountdown) % 30 === 0 && this.raceProcessStarted) {
                this.commentator.produceMessage('raceState', { participants: this.participants });
            }

            // Random info message
            if (Math.random() < 0.35) {
                this.commentator.produceMessage('randomInfo');
            }
        }, 1000);
    };

    prepareRace() {
        this.toggleRaceState();
        this.resetCountdowns();
        this.initParticipants();

        this.io.to('racing').to('after-race').emit('prepare-race', { participants: this.participants });
        this.commentator.produceMessage('raceStart', { participants: this.participants });

        this.currentText = this.nextText;
        this.nextText = GameFlow.getRandomItemFromArray(TEXTS); // Get next race text
    }

    startRace() {
        this.io.to('racing').emit('start-race');
    }

    toggleRaceState() {
        this.raceProcessStarted = !this.raceProcessStarted;
    }

    initParticipants() {
        const waitingRoom = this.io.sockets.adapter.rooms['waiting'];
        const afterRaceRoom = this.io.sockets.adapter.rooms['after-race'];
        const waitingClients = waitingRoom ? waitingRoom.sockets : {};
        const afterRaceClients = afterRaceRoom ? afterRaceRoom.sockets : {};

        this.participants = Object.keys({ ...waitingClients, ...afterRaceClients }).map(socketId => { // Built-in higher-order function "map"
            const socket = this.io.sockets.connected[socketId];
            const { username } = this.getUserFromJWT(socket.handshake.query.token);
            socket.leave('waiting');
            socket.leave('after-race');
            socket.join('racing');

            socket.on('char-entered', ({ token }) => {
                jwt.verify(token, 'secret', (error, { username }) => {
                    if (!error) {
                        const userIndex = this.participants.findIndex(user => user.username === username); // Built-in higher-order function "findIndex"
                        this.participants[userIndex].enteredSymbols++;

                        if (this.currentText.length - this.participants[userIndex].enteredSymbols === 30) {
                            this.commentator.produceMessage('preFinish', { finishingParticipantName: username });
                        }

                        this.io.to('racing').to('after-race').emit('participants-data', { participants: this.participants});
                    } else {
                        console.log(error);
                    }
                });
            });

            socket.on('finished', ({ token }) => {
                jwt.verify(token, 'secret', (error, { username }) => {
                    if (!error) {
                        const userIndex = this.participants.findIndex(user => user.username === username); // Built-in higher-order function "findIndex"
                        this.participants[userIndex].usedTime = this.getUsedTime();

                        this.io.to('racing').to('after-race').emit('participants-data', { participants: this.participants });
                        socket.leave('racing');
                        socket.join('after-race');
                        socket.emit('end-race');

                        this.commentator.produceMessage('finish', { finishedParticipantName: username });

                        const numOfFinishedParticipants = this.getNumOfFinishedParticipants();

                        if (numOfFinishedParticipants === this.participants.length) {
                            this.waitingCountdown = this.defaultWaitTime;
                            this.stopRace();
                        }

                        socket.emit('waiting-countdown', { time: this.getFormattedTime(this.waitingCountdown) });
                    } else {
                        console.log(error);
                    }
                });
            });

            socket.on('disconnect', _.partial(this.onDisconnect, username)); // Partial application

            return { username, usedTime: 0, enteredSymbols: 0, leaved: false, car: GameFlow.getRandomItemFromArray(CARS)};
        });
    }

    // Partial application
    onDisconnect(username, ...args) {
        if (!this.participants) return;
        const userIndex = this.participants.findIndex(user => user.username === username); // Built-in higher-order function "findIndex"
        this.participants[userIndex].leaved = true;

        const numOfFinishedParticipants = this.getNumOfFinishedParticipants();
        const numOfLeftParticipants = this.participants.length - numOfFinishedParticipants;

        if (numOfLeftParticipants <= 1) {
            this.waitingCountdown = Math.min(this.defaultWaitTime, this.waitingCountdown);
            if (numOfLeftParticipants === 1) {
                this.stopRace();
            }
        }

        this.io.to('racing').to('after-race').emit('participants-data', { participants: this.participants });
    }

    getNumOfFinishedParticipants() {
        return this.participants.reduce((acc, curr) => { // Built-in higher-order function "reduce"
            acc += curr.usedTime || curr.leaved ? 1 : 0;
            return acc;
        }, 0);
    }

    getUserFromJWT(token) { // Pure function
        const { username, email } = jwt.decode(token);
        return { username, email };
    }

    getFormattedTime(seconds) { // Pure function
        return prettyMs(seconds * 1000);
    }

    getUsedTime() {
        const usedTime = this.defaultRaceTime - this.racingCountdown;
        return Math.max(usedTime, 0);
    }

    stopRace() {
        this.toggleRaceState();

        this.io.to('racing').emit('end-race');
        this.io.to('racing').emit('waiting-countdown', { time: this.getFormattedTime(this.waitingCountdown) });

        this.transferLeftClients();
        this.removeListeners();

        this.commentator.produceMessage('raceEnd', { participants: this.participants });
    }

    transferLeftClients() {
        const raceRoom = this.io.sockets.adapter.rooms['racing'];
        const raceClients = raceRoom ? raceRoom.sockets : {};

        // Pipeline of two functions: Object.keys, forEach
        Object.keys(raceClients).forEach(socketId => { // Built-in higher-order function "forEach"
            const socket = this.io.sockets.connected[socketId];
            const { username } = this.getUserFromJWT(socket.handshake.query.token);
            const userIndex = this.participants.findIndex(user => user.username === username); // Built-in higher-order function "findIndex"
            this.participants[userIndex].usedTime = this.getUsedTime();

            socket.leave('racing');
            socket.join('after-race');
        });
    }

    removeListeners() {
        const afterRaceRoom = this.io.sockets.adapter.rooms['after-race'];
        const afterRaceClients = afterRaceRoom ? afterRaceRoom.sockets : {};
        // Pipeline of two functions: Object.keys, forEach
        Object.keys(afterRaceClients).forEach(socketId => { // Built-in higher-order function "forEach"
            const socket = this.io.sockets.connected[socketId];
            socket.removeAllListeners('finished');
            socket.removeAllListeners('char-entered');
            socket.removeListener('disconnect', this.onDisconnect);
        });
    }

    stopPlaying() {
        clearInterval(this.timer);
        this.resetCountdowns();
        this.raceProcessStarted = false;
        this.participants = null; // clear participants data if no users on the page (stopPlaying is triggered at 0 sockets)
    };

    getRaceText() {
        return this.nextText;
    }

    getWaitingCountdown() {
        return this.getFormattedTime(this.waitingCountdown);
    }
}

module.exports = GameFlow;