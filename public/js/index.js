/* eslint-disable */

import '@babel/polyfill';
import {
    login,
    logout
} from './login'
import {
    displayMap
} from './mapBox';
import {
    updateSettings
} from './updateSettings'
import {
    bookTour
} from './stripe'
import {
    showAlert
} from './alerts';
const mapBox = document.getElementById("map");
const updateUserForm = document.querySelector('.form-user-data');
const updatePasswordForm = document.querySelector('.form-user-password');
const loginForm = document.querySelector('.form--login');
const logoutButton = document.querySelector('.nav__el--logout');
const bookBtn = document.getElementById('book-tour');
if (mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}
console.log('hey', window.location.href);
if (loginForm) {
    loginForm.addEventListener("submit", e => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        e.preventDefault();

        login(email, password);
    })
}

if (logoutButton) {
    logoutButton.addEventListener("click", e => {
        logout()
    });
}
if (updateUserForm) {
    updateUserForm.addEventListener("submit", e => {
        e.preventDefault();
        //to add the photo and data
        const form = new FormData();
        form.append('name', document.getElementById("name").value);
        form.append('email', document.getElementById("email").value);
        form.append('photo', document.getElementById("photo").files[0]);
        console.log(form);
        //axios recognizes the form data and automatically sends
        updateSettings(form, "data");
    });
}

if (updatePasswordForm) {
    updatePasswordForm.addEventListener("submit", async e => {
        e.preventDefault();
        const passwordButton = document.querySelector('.btn--save-password');
        passwordButton.textContent = "Updating..."
        const passwordCurrent = document.getElementById("password-current").value;
        const password = document.getElementById("password").value;
        const passwordConfirm = document.getElementById("password-confirm").value;
        await updateSettings({
            passwordCurrent,
            password,
            passwordConfirm
        }, "password");
        document.getElementById("password-current").value = '';
        document.getElementById("password").value = '';
        document.getElementById("password-confirm").value = '';
        passwordButton.textContent = "Save Password";
    });

}

if (bookBtn) {
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...';
        //tour-id converts to tourId
        const {
            tourId
        } = e.target.dataset;
        bookTour(tourId);
    })
}

const alertMessage = document.querySelector('body').dataset.alert;
if (alertMessage) {
    showAlert('success', alertMessage, 20);
}