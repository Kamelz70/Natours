/* eslint-disable */
import axios from 'axios';
const stripe = Stripe('pk_test_51M4ELiHEzzss8Cm6IneYPNqj0t710LtvAUx5EAcTshhxDQAlyo69G8JYoBQT78tmp5gGShDZIjew0bP5kRNH1iUX00V3pNA1mZ');

export const bookTour = async tourId => {
    try {
        //1)Get API Checkout session
        const session = await axios(`http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`);
        // 2) create checkout form + charge credit card
        stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    } catch (e) {
        showAlert("error", e);
    }


}