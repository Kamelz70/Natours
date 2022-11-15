const express = require('express');
const authController = require('../controllers/authController');
const toursController = require('../controllers/toursController');
// const reviewController = require("../controllers/reviewController");
const reviewsRouter = require('./reviewsRouter');

const router = express.Router();

router.use('/:tourID/reviews', reviewsRouter);
// router.route("/:tourID/reviews").post(authController.protect, authController.restrictTo("user"), reviewController.createReview);

router
    .route('/top-5-cheap')
    .get(toursController.cheapAlias, toursController.getAllTours);
router.route('/tours-stats').get(toursController.getToursStats);
router
    .route('/monthly-plan/:year')
    .get(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide', 'guide'),
        toursController.getMonthlyPlan
    );
// router.param('id', toursController.checkID);
router
    .route('/')
    .get(authController.protect, toursController.getAllTours)
    .post(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        toursController.createTour
    );

router
    .route('/:id')
    .get(toursController.getTourById)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        toursController.uploadTourImages,
        toursController.resizeTourImages,
        toursController.updateTour
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        toursController.deleteTour
    );

router.route(
    '/within/distance/:distance/unit/:unit/centerLatLng/:latlng',
).get(toursController.getToursWithin);
router.route(
    '/distances/:latlng/unit/:unit',
).get(toursController.getToursDistances);
module.exports = router;