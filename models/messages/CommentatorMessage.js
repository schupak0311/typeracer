'use strict';

class CommentatorMessage { // Interface :/ (at least in my imagination)
    constructor() {
    }

    getMessageText() { // Virtual method :D
        return 'Default message';
    }
}

module.exports = CommentatorMessage;