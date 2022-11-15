const express = require('express');

const usersController = require("../controllers/usersController");
const authController = require("../controllers/authController");


const router = express.Router();

////////////////////////////authentication controllers
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.route('/forgotPassword').post(authController.forgotPassword);
router.route('/resetPassword/:token').patch(authController.resetPassword);
//protect routes after this point
router.use(authController.protect);

router.route('/updateMyPassword').patch(authController.updatePassword);
////////////////////////////user controllers
router.route('/me').get(usersController.getMe, usersController.getUser);
//photo is th efield in the api t get the image from (single for one image)
router.route('/updateMe').patch(usersController.uploadUserPhoto, usersController.resizeUserPhoto, usersController.updateMe);
router.route('/deleteMe').delete(usersController.deleteMe);

router.use(authController.restrictTo("admin"));

router.route('/').get(usersController.getAllUsers).post(usersController.createUser);
router.route('/:id').get(usersController.getUser).patch(authController.restrictTo("admin"), usersController.updateUser).delete(authController.restrictTo("admin"), usersController.deleteUser);

module.exports = router;