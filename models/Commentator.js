'use strict';

const CommentatorMessage = require('./messages/CommentatorMessage');
const RandomMessage = require('./messages/RandomMessage');
const RaceStartMessage = require('./messages/RaceStartMessage');
const RaceStateMessage = require('./messages/RaceStateMessage');
const PreFinishMessage = require('./messages/PreFinishMessage');
const FinishMessage = require('./messages/FinishMessage');
const RaceEndMessage = require('./messages/RaceEndMessage');

const MESSAGE_MOCKS = require('../data/randomMessages');
const TRIGGER_LENGTH = 30;

class Commentator {
    constructor(io) {
        this._io = io;
        this._importantMessage = false;
        this._randomMessage = false;

        this.produceMessage = this.produceMessage.bind(this);

        return new Proxy(this, { // Privatize properties with Proxy
            get(target, prop) {
                if (prop.startsWith('_')) return;
                if (typeof (target[prop]) === "function") {
                    return target[prop].bind(this);
                }
                return target[prop];
            },
            set(target, prop, value) {
                if (prop.startsWith('_')) return false;
                target[prop] = value;
                return true
            },
            has(target, prop) {
                return !prop.startsWith('_');
            },
            deleteProperty(target, prop) {
                if (prop.startsWith('_')) return false;
                delete target[prop];
                return true;
            },
            ownKeys(target) {
                return Object.keys(target).filter(prop => !prop.startsWith('_'));
            },
            getOwnPropertyDescriptor(target, prop) {
                const descriptor = Object.getOwnPropertyDescriptor(target, prop);
                if (prop.startsWith('_')) descriptor.enumerable = false;
                return descriptor;
            }
        });
    }

    produceMessage(type, options) {
        const message = this._messageFactory(type, options);
        if (!message) return;
        this._io.to('racing').to('after-race').emit('messages-message', message);
    }

    // Factory
    _messageFactory(messageType, options = {}) {
        let message;
        switch (messageType) {
            case 'raceStart':
                message = new RaceStartMessage(options.participants);
                this._randomMessage = false;
                break;
            case 'raceState':
                message = new RaceStateMessage(options.participants);
                break;
            case 'randomInfo':
                if (this._importantMessage || this._randomMessage) return;
                message = new RandomMessage(MESSAGE_MOCKS.randomInfo);
                break;
            case 'preFinish':
                message = new PreFinishMessage(options.finishingParticipantName, TRIGGER_LENGTH);
                break;
            case 'finish':
                message = new FinishMessage(options.finishedParticipantName);
                break;
            case 'raceEnd':
                message = new RaceEndMessage(options.participants);
                this._randomMessage = true;
                break;
            default:
                message = new CommentatorMessage();
                break;
        }

        const messageObject = this._getMessageObject(message);
        this._setMessageTimer(messageType, messageObject.duration);

        return messageObject;
    }

    _getMessageObject(message) {
        const messageText = message.getMessageText();
        const duration = this._getMessageDuration(messageText);

        return { message: messageText, duration };
    }

    _getMessageDuration(message) { // Pure function
        return (message.length * 0.1) * 1000;
    };

    _setMessageTimer(messageType, duration) {
        if (messageType === 'randomInfo') {
            this._randomMessage = true;
            if (this.randomMessageTimer) clearTimeout(this.randomMessageTimer);
            this.randomMessageTimer = setTimeout(() => { // Built-in higher-order function "setTimeout"
                this._randomMessage = false;
            }, duration);
        } else {
            this._importantMessage = true;
            if (this.importantMessageTimer) clearTimeout(this.importantMessageTimer);
            this.importantMessageTimer = setTimeout(() => { // Built-in higher-order function "setTimeout"
                this._importantMessage = false;
            }, duration);
        }
    }
}

module.exports = Commentator;