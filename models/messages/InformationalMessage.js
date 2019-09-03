'use script';

const CommentatorMessage = require('./CommentatorMessage');

class InformationalMessage extends CommentatorMessage {
    constructor(participants) {
        super();
        this.participants = participants;

        this.sortParticipants();
    }

    getOrdinalLetter(number) {
        if (number < 1) {
            return;
        } else if (number % 10 === 1) {
            return 'st';
        } else if (number % 10 === 2) {
            return 'nd';
        } else if (number % 10 === 3) {
            return 'rd';
        } else {
            return 'th';
        }
    }

    sortParticipants() {
        this.participants.sort((participantA, participantB) => { // Built-in higher-order function "sort"
            if (participantA.leaved) return 1;
            if (participantB.leaved) return -1;
            const symbolsDiff = participantB.enteredSymbols - participantA.enteredSymbols;
            if (!symbolsDiff) {
                return participantA.usedTime - participantB.usedTime;
            }
            return symbolsDiff;
        });
    }
}

module.exports = InformationalMessage;