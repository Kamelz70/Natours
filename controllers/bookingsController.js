const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const handlerFactory = require('./handlerFactory');
const catchAsync = require("../utils/catchAsync");
const User = require('../models/userModel');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

//////////////////////////////////////////////
// Helper functions
const createBookingCheckout = catchAsync(async (session) => {
    const tourId = session.client_reference_id;
    const userId = (await User.findOne({
        email: session.customer_email
    })).id;
    const price = session.line_items[0].price_data.unit_amount / 100;

    await Booking.create({
        tourId,
        userId,
        price
    });

});

//////////////////////////////////////////////
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    //get currently booked tour
    const tour = await Tour.findById(req.params.tourID)
    //create checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        //success url sends the needed data to save a booking
        //unsafe operation ,use stripe webhooks instead
        //any user can use this link too book without paying
        // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourID}&user=${req.user.id}&price=${tour.price}`,
        success_url: `${req.protocol}://${req.get('host')}/my-tours`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        // referenceID used to save the tourID into the sessuion
        // to Identify when later recieved
        client_reference_id: req.params.tourID,
        line_items: [{
            quantity: 1,
            price_data: {
                currency: "usd",
                unit_amount: tour.price * 100,
                product_data: {
                    name: `${tour.name} Tour`,
                    description: `${tour.summary}`, //description here
                    images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                },
            },
        }],
        mode: 'payment',
    });
    //send session to client
    res.status(200).json({
        status: 'success',
        session
    });
});

//create it as a middleware in the successurl page
//to check if these queries are existent and save a booking
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//     const {
//         tour,
//         user,
//         price
//     } = req.query;
//     if (!tour && !user && !price) return next();

//     await Booking.create({
//         tour,
//         user,
//         price
//     });

//     //redirect request to root to hide booking data
//     res.redirect(req.originalUrl.split('?')[0]);
// });

exports.createBooking = handlerFactory.createOne(Booking);
exports.updateBooking = handlerFactory.updateOne(Booking);
exports.deleteBooking = handlerFactory.deleteOne(Booking);
exports.getBooking = handlerFactory.getOne(Booking);
exports.getAllBookings = handlerFactory.getAll(Booking);
exports.webhookCheckout = (req, res, next) => {
    const signature = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook error: ${err.message}`)
    }
    if (event.type === 'checkout.session.complete') {
        createBookingCheckout(event.data.object);
    }
    res.status(200).json({
        recieved: true
    });

}