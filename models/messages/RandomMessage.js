'use script';

const CommentatorMessage = require('./CommentatorMessage');

class RandomMessage extends CommentatorMessage {
    constructor(messageList) {
        super();
        this.messageList = messageList;
    }

    getMessageText() {
        return this.messageList[Math.floor(Math.random() * this.messageList.length)];
    }
}

module.exports = RandomMessage;