const express = require('express');
const router = express.Router();
//const multer = require('multer')

//const userController = require('../controller/userController');
const authController = require('../controller/authController');
const userController = require('../controller/userController');

//! Multer test save image witouth extension 
 //const upload = multer({dest: 'public/img/users'});

router.post('/signup', authController.signup)
router.post('/login', authController.loginUser)
router.get('/logout', authController.logout)
router.post('/forgetpassword', authController.forgetPassword);
router.patch('/resetpassword/:token', authController.resetPassword);

//!protect all this route after this middleware
//router.use(authController.protect)

router.get('/me', authController.protect, userController.getMe, userController.getUser);

router.patch('/updatemypassword',authController.protect, authController.updatePassword);
//!in this 'updateme' route get user id from 'authController.protect' middleware because it's check user logged in or not we save user data in 'req.user = currentUser' this req.user has all user fields details.
router.patch('/updateme', authController.protect, userController.uploadUserPhoto, userController.resizeUerPhoto,  userController.updateMe);
router.delete('/deleteme', authController.protect, userController.deleteMe);

//! we set only admin can fetch and do CRUD with the users below as we know before performing the request below route it will check only admin logged in or not.
router.use(authController.restrictTo('admin'));

//! i was not creating it controller laogic i've just send response for to make sure its working.
 router.route('/').get(userController.getAllUsers).post(userController.createUser);
 router.route('/:id').get(userController.getUser).patch(userController.updateUser).delete(userController.deleteUser)

module.exports = router;