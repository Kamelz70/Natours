const express = require('express');
const bookingsController = require('../controllers/bookingsController');
const authController = require('../controllers/authController');

const router = express.Router();
router.use(authController.protect);

router.get('/checkout-session/:tourID', bookingsController.getCheckoutSession)

router.use(authController.restrictTo('admin', 'lead-guide'));

router.route('/').get(bookingsController.getAllBookings).post(bookingsController.createBooking)
router.get('/:id', bookingsController.getBooking).patch(bookingsController.updateBooking).delete(bookingsController.deleteBooking)
module.exports = router;