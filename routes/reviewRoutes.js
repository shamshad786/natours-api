const express = require('express');

const router = express.Router({mergeParams: true});


const authController  = require('../controller/authController');
const reviewController = require('../controller/reviewController');
//! we this middleware at the top because we want only logged in user can access the reviews so this middleware run and check user is logged in or not
router.use(authController.protect)

//yaha is post ke ander is route aisa rahega '/6282gbdjd63gsdg/reviews' yaha tour ki id tourRoutes se 'mergeParams' ke through merge kiya hai
router.post('/',authController.restrictTo('user'), reviewController.setTourUserId,  reviewController.reviewCreate);

router.get('/', reviewController.reviewGet);

router.get('/:id', reviewController.getReview);

router.patch('/:id', authController.restrictTo('user', 'admin'), reviewController.updateReview);

router.delete('/:id', authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;
