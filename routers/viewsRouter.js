const express = require("express");
const viewsController = require("../controllers/viewsController");
const authController = require("../controllers/authController");
const bookingsController = require("../controllers/bookingsController");

const router = express.Router();
router.use(viewsController.alerts)
//protected routes don;t need isLoggedIn for duplicate ops
router.get('/me', authController.protect, viewsController.getAccount);
router.get('/my-tours', authController.protect, viewsController.getMyTours);
router.post('/submit-user-data', authController.protect, viewsController.updateUserData);

router.use(authController.isLoggedIn);

router.get('/',
    // bookingsController,
    viewsController.getOverview);
router.get('/tour/:slug', viewsController.getTour);
router.get('/login', viewsController.getLoginForm);

module.exports = router;