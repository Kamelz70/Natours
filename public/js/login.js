/* eslint-disable */
import axios from 'axios';
import {
    showAlert
} from './alerts';
const rootURL = `https://natourskamelaliz.herokuapp.com/api/v1`;
export const login = async (email, password) => {
    try {
        console.log(rootURL);
        const res = await axios({
            method: "POST",
            url: `${rootURL}/users/login`,
            data: {
                email,
                password
            }
        });
        if (res.data.status === 'success') {
            showAlert("success", "Logged in successfully");
            window.setTimeout(() => {
                location.assign('/');
            }, 0);
        }
        // console.log(res);
    } catch (err) {
        showAlert("error", err.response.data.message);
        console.log(err.stack)

    }
}

export const logout = async () => {
    try {
        const res = await axios({
            method: "GET",
            url: `${rootURL}/users/logout`,
        });
        if (res.data.status === "success") {
            //reload page true ro get from server not from cache
            location.reload(true);
        }
    } catch (err) {
        // console.log(err);
        showAlert("error", "Logut Error, Try again");
    }
}