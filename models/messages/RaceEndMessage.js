'use script';

const prettyMs = require('pretty-ms');
const InformationalMessage = require('./InformationalMessage');

class RaceEndMessage extends InformationalMessage {
    constructor(participants) {
        super(participants);
    }

    getMessageText() {
        const prizePlaces =  this.participants.slice(0, 3).reduce((messageString, { username, usedTime, leaved }, index) => { // Built-in higher-order function "reduce"
            let participantResult;
            if (leaved) {
                participantResult = `${username} didn't make it to the end. `
            } else {
                participantResult = `${username} ended on the ${index + 1}${this.getOrdinalLetter(index + 1)} place with the time of ${prettyMs(usedTime * 1000)}. `;
            }
            return `${messageString}${participantResult}`;
        }, 'Okay that was an intensive race! What we got in result... ');

        return `${prizePlaces} It was pleasure for us to host this race. See y'all later!`
    }
}

module.exports = RaceEndMessage;