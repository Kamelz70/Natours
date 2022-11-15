const Booking = require("../models/bookingModel");
const Tour = require("../models/tourModel");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");

exports.getOverview = catchAsync(async (req, res, next) => {
    //1)Get tour data from collection
    const tours = await Tour.find();
    //2)build template
    //3)Render Template with tour data
    res.status(200).render("overview", {
        title: "All Tours",
        tours
    });
});
exports.getTour = catchAsync(async (req, res, next) => {
    //1) get data for requested tour
    const tour = await Tour.findOne({
        slug: req.params.slug
    }).populate({
        path: "reviews",
        select: "review rating user"
    });
    if (!tour) {
        return next(new AppError("No tour with that name", 404));
    }
    //2) build template
    //3)render template
    res.status(200).render("tour", {
        title: `${tour.name} tour`,
        tour
    });
});
exports.getLoginForm = catchAsync(async (req, res, next) => {

    //2) build template
    //3)render template
    res.status(200).render("login");
});

exports.getAccount = catchAsync(async (req, res, next) => {

    //2) build template

    //3)render template
    res.status(200).render("account", {
        title: "Your Account"
    });
});

exports.updateUserData = catchAsync(async (req, res, next) => {

    //2) build template
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
        name: req.body.name,
        email: req.body.email,
    }, {
        new: true,
        runValidators: true
    });
    //3)render template
    res.status(200).render("account", {
        title: "Your Account",
        user: updatedUser
    });
});

exports.getMyTours = catchAsync(async (req, res, next) => {

    //find all bookings,
    const bookings = await Booking.find({
        user: req.user.id
    });
    //find tours of bookings
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({
        _id: {
            //in operator searches in array for ids
            $in: tourIDs
        }
    });
    res.status(200).render('overview', {
        title: 'My Tours',
        tours,
        user: req.user
    })
});