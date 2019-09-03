'use strict';

window.onload = () => {
    const jwt = localStorage.getItem('jwt');

    if (jwt) {
        location.replace('/game');
    } else {
        const emailInput = document.getElementById('email-input');
        const passwordInput = document.getElementById('password-input');
        const loginButton = document.getElementById('login-button');

        loginButton.addEventListener('click', (event) => {
            fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value
                })
            }).then(res => {
                res.json().then(body => {
                    if (body.auth) {
                        localStorage.setItem('jwt', body.token);
                        location.replace('/game');
                    } else {
                        console.log('Auth failed')
                    }
                });
            }).catch(error => {
                console.log(error);
            });
        });
    }
};