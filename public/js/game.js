'use strict';

import {
    showRaceLayout,
    hideRaceLayout,
    generateParticipantsTableRows,
    clearParticipantsTable,
    showCommentMessage,
    showPreRaceCountdown
} from './viewControls.js';

window.onload = () => {
    const jwt = localStorage.getItem('jwt');

    if (!jwt) {
        location.replace('/login');
    } else {
        const socket = io('http://localhost:3000', { query: { token: jwt }});
        let currentRaceText, nextRaceText, enteredSymbols;

        const countdownContainer = document.body.querySelector('.countdown');
        const raceTimer = document.body.querySelector('.race-timer');
        const currentCharContainer = document.body.querySelector('.current-char');
        const participantsTable = document.body.querySelector('.race-participants');
        const fullPageTextContainer = document.body.querySelector('.full-page-text-container');

        const getRaceText = () => {
            fetch('/text', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            }).then(res => {
                res.json().then(body => {
                    nextRaceText = body.text;
                })
            });
        };

        const highlightAtIndex = (index) => {
            const raceTextContainer = document.body.querySelector('.race-text');
            raceTextContainer.innerHTML = `<span class="previous-chars-highlight">${currentRaceText.slice(0, index)}</span><span class="current-char-highlight">${currentRaceText[index] || ''}</span>${currentRaceText.slice(index + 1)}`;
        };

        const keypressHandler = (event) => {
            const { keyCode } = event;
            if (String.fromCharCode(keyCode) === currentRaceText[enteredSymbols]) {
                socket.emit('char-entered', { token: jwt });
                enteredSymbols++;

                if (currentRaceText.length === enteredSymbols) {
                    socket.emit('finished', { token: jwt });
                }

                highlightAtIndex(enteredSymbols);
                currentCharContainer.textContent = currentRaceText[enteredSymbols] === ' ' ? '[space]' : currentRaceText[enteredSymbols];
            }
        };

        getRaceText();

        socket.on('waiting-countdown', ({ time }) => {
            countdownContainer.textContent = `Next race starts in: ${time}`;
        });

        socket.on('pre-racing-countdown', ({ time }) => {
            const numOfSeconds = time.slice(0, -1);
            showPreRaceCountdown(numOfSeconds);
            raceTimer.textContent = `${time} left before the start`;
        });

        socket.on('racing-countdown', ({ time }) => {
            raceTimer.textContent = `${time} left`;
        });

        socket.on('prepare-race', ({ participants }) => {
            currentRaceText = nextRaceText;
            fullPageTextContainer.style.display = 'flex';
            enteredSymbols = 0;
            showRaceLayout(participants, currentRaceText);
        });

        socket.on('start-race', () => {
            fullPageTextContainer.style.display = 'none';
            highlightAtIndex(0);

            document.body.addEventListener('keypress', keypressHandler);
        });

        socket.on('end-race', () => {
            hideRaceLayout();
            fullPageTextContainer.style.display = 'none';
            document.body.removeEventListener('keypress', keypressHandler);

            getRaceText();
        });

        socket.on('participants-data', ({ participants }) => {
            clearParticipantsTable();

            const tableRows = generateParticipantsTableRows(participants, currentRaceText.length);
            // Pipeline of two functions: sort and forEach
            [...tableRows].sort((rowA, rowB) => { // Built-in higher-order function "sort"
                const userA = participants.find(user => user.username === rowA.cells[0].textContent);
                const userB = participants.find(user => user.username === rowB.cells[0].textContent);

                if (userA.leaved) return 1;
                if (userB.leaved) return -1;
                const symbolsDiff = userB.enteredSymbols - userA.enteredSymbols;
                if (!symbolsDiff) {
                    return userA.usedTime - userB.usedTime;
                }
                return symbolsDiff;
            }).forEach(row => { // Built-in higher-order function "forEach"
                participantsTable.tBodies[0].appendChild(row);
            });
        });

        socket.on('messages-message', ({ message, duration }) => {
            showCommentMessage(message, duration);
        });
    }
};