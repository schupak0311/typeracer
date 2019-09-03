'use script';

const CommentatorMessage = require('./CommentatorMessage');

class FinishMessage extends CommentatorMessage  {
    constructor(finishedParticipantName) {
        super();
        this.finishedParticipantName = finishedParticipantName;
    }

    getMessageText() {
        return `${this.finishedParticipantName} finished the race!`;
    }
}

module.exports = FinishMessage;