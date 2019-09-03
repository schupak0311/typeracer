'use script';

const InformationalMessage = require('./InformationalMessage');

const CAR_ADJECTIVES = ['shiny', 'beautiful', 'legendary', 'ultimate', 'fast', 'rusty', 'dusty'];

class RaceStartMessage extends InformationalMessage {
    constructor(participants) {
        super(participants);
    }

    getMessageText() {
        return this.participants.reduce((messageString, participant, index) => { // Built-in higher-order function "reduce"
            return `${messageString}On the ${index + 1}${this.getOrdinalLetter(index + 1)} place - ${participant.username} in his/her ${this.getRandomCarAdjective()} ${participant.car}. `;
        }, 'Hi everyone, we are Jerry and Michael, hosts of today\'s race! And here\'s the starting grid. ');
    }

    getRandomCarAdjective() {
        return CAR_ADJECTIVES[Math.floor(Math.random() * CAR_ADJECTIVES.length)];
    }
}

module.exports = RaceStartMessage;