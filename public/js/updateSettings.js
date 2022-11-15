/* eslint-disable */

import axios from 'axios';
import {
    showAlert
} from './alerts';
const rootURL = "http://127.0.0.1:3000/api/v1/users";

export const updateSettings = async (data, type) => {
    // type: password or data
    try {
        const url = type === "password" ? `${rootURL}/updateMyPassword` : `${rootURL}/updateMe`;
        const res = await axios({
            method: "PATCH",
            url,
            data
        });
        if (res.data.status === "success") {
            showAlert("success", `${type.toUpperCase()} Updated successfully`);
            window.setTimeout(() => {
                location.reload();
            }, 5000);
        }
    } catch (err) {
        showAlert("error", err.response.data.message);
    }
}