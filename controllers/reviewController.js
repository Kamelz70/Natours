const Review = require("../models/reviewModel");
const handlerFactory = require("./handlerFactory");
// const catchAsync = require("../utils/catchAsync");
//////////////////////////////////////////////////////////////////////////
// MiddleWare:
exports.setTourAndUser = (req, res, next) => {
    if (!req.body.tour) {
        req.body.tour = req.params.tourID
    }
    if (!req.body.user) {
        req.body.user = req.user.id;
    }
    next();
}


//////////////////////////////////////////////////////////////////////
// Req Handlers

exports.getAllReviews = handlerFactory.getAll(Review);
exports.getReviewById = handlerFactory.getOne(Review);
exports.createReview = handlerFactory.createOne(Review);
exports.deleteReview = handlerFactory.deleteOne(Review);
exports.updateReview = handlerFactory.updateOne(Review)