'use strict';

window.onload = () => {
    const jwt = localStorage.getItem('jwt');

    if (jwt) {
        location.replace('/game');
    } else {
        location.replace('/login')
    }
};