'use script';

const InformationalMessage = require('./InformationalMessage');

class RaceStateMessage extends InformationalMessage {
    constructor(participants) {
        super(participants);
    }

    getMessageText() {
        return this.participants.reduce((messageString, { username, enteredSymbols }, index) => { // Built-in higher-order function "reduce"
            return `${messageString}${username} is on the ${index + 1}${this.getOrdinalLetter(index + 1)} place with the ${enteredSymbols} entered symbols. `;
        }, 'Okay folks, what do we have here... ');
    }
}

module.exports = RaceStateMessage;