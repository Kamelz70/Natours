const express = require('express');
const reviewsController = require('../controllers/reviewController');
const authController = require('../controllers/authController');

const router = express.Router({
    mergeParams: true,
});
router.use(authController.protect);
router
    .route('/')
    .get(reviewsController.getAllReviews)
    .post(
        authController.restrictTo('user'),
        reviewsController.setTourAndUser,
        reviewsController.createReview
    );
router
    .route('/:id')
    .get(
        reviewsController.getReviewById
    )
    .delete(
        authController.restrictTo('user', 'admin'),
        reviewsController.deleteReview
    )
    .patch(
        authController.restrictTo('user', 'admin'),
        reviewsController.updateReview
    );

module.exports = router;