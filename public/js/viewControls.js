'use strict';

const countdownContainer = document.body.querySelector('.countdown');
const raceContainer = document.body.querySelector('.race-container');
const raceTextContainer = document.body.querySelector('.race-text');
const participantsTable = document.body.querySelector('.race-participants');
const commentatorsContainer = document.body.querySelector('.commentators');
const currentCharContainer = document.body.querySelector('.current-char');
let commentMessageTimer;

const showRaceLayout = (participants, raceText) => {
    raceContainer.insertBefore(participantsTable, raceTextContainer);
    raceContainer.insertBefore(commentatorsContainer, raceTextContainer);
    countdownContainer.style.display = 'none';
    raceContainer.style.display = 'flex';
    raceTextContainer.textContent = raceText;
    currentCharContainer.textContent = raceText[0];
    clearParticipantsTable();
    // Pipeline of two functions
    generateParticipantsTableRows(participants, raceText.length).forEach(row => { // Built-in higher-order function "forEach"
        participantsTable.tBodies[0].appendChild(row);
    });
};

const generateParticipantsTableRows = (participants, textLength) => {
    return participants.map(({ username, enteredSymbols, leaved }) => { // Built-in higher-order function "map"
        const tr = document.createElement('tr');
        const tdUsername = document.createElement('td');
        const tdProgressBar = document.createElement('td');
        const progressBarContainer = document.createElement('div');
        const progressBar = document.createElement('div');

        progressBarContainer.className = 'progress-bar-container';
        progressBar.className = 'progress-bar';
        progressBar.style.width = `${Math.round(enteredSymbols / textLength * 100)}%`;
        progressBarContainer.appendChild(progressBar);
        tdProgressBar.appendChild(progressBarContainer);
        tdUsername.textContent = username;
        if (leaved) tdUsername.className = 'leaved-participant';

        tr.appendChild(tdUsername);
        tr.appendChild(tdProgressBar);
        return tr;
    })
};

const hideRaceLayout = () => {
    countdownContainer.style.display = 'block';
    raceContainer.style.display = 'none';
    document.body.querySelector('.container').insertBefore(participantsTable, countdownContainer);
    document.body.querySelector('.container').insertBefore(commentatorsContainer, countdownContainer);
};

const clearParticipantsTable = () => {
    [...participantsTable.tBodies[0].rows].forEach(row => {
        row.parentElement.removeChild(row);
    });
};

const showCommentMessage = (message, duration) => {
    const commentMessageContainer = document.querySelector('.comment-message');
    commentMessageContainer.firstChild.textContent = message;
    commentMessageContainer.style.display = 'block';

    if (commentMessageTimer) clearTimeout(commentMessageTimer);
    commentMessageTimer = setTimeout(() => { // Built-in higher-order function "setTimeout"
        commentMessageContainer.style.display = 'none';
    }, duration);
};

const showPreRaceCountdown = (digit) => {
    const fullPageText = document.body.querySelector('.full-page-text');
    fullPageText.textContent = digit;
};

export {
    showRaceLayout,
    hideRaceLayout,
    generateParticipantsTableRows,
    clearParticipantsTable,
    showCommentMessage,
    showPreRaceCountdown
};