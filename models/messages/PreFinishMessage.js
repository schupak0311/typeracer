'use script';

const CommentatorMessage = require('./CommentatorMessage');

class PreFinishMessage extends CommentatorMessage  {
    constructor(finishingParticipantName, triggerLength) {
        super();
        this.finishingParticipantName = finishingParticipantName;
        this.triggerLength = triggerLength;
    }

    getMessageText() {
        return `${this.finishingParticipantName} is only ${this.triggerLength} clicks from the finish line!`;
    }
}

module.exports = PreFinishMessage;