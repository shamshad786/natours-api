 const express = require('express');
const tourController = require('../controller/tourController');
const authController = require('../controller/authController');
//const reviewController = require('../controller/reviewController');

const reviewRouter = require('../routes/reviewRoutes');

const router = express.Router();


router.param('id',(req,res,next,val)=>{ //! ye param middleware hai... ye val ke ander params ke ander jo id hoti hai usko leta hai 
    console.log('tour id: ', val);
    next() 
});

router.get('/tours-stats', tourController.getTourStats);
router.get('/monthly-plan/:year', authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);


router.get('/top-5-cheap',tourController.aliasTours, tourController.getAllTours)// this is alising route for get top-5-cheap tours packages
router.get('/', tourController.getAllTours);
router.get('/:id',tourController.getSingleTours);
//router.post('/',tourController.checkTourBody ,tourController.createTours);
router.post('/', authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTours);

//!upload multer multiple images and resize tour images middleware used in this route
router.patch('/:id',  authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.uploadTourImages, tourController.resizeTourImages, tourController.updateTour);

router.delete('/:id',authController.protect,authController.restrictTo('admin', 'lead-guide') , tourController.deleteTour);


//!geospecial tours radius within miles tour route.
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);
//tours-within/233/center/-40,45/unit/mi  (mi -> miles)

//! geospatical aggregation ditance calculating route
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

//! nested route for creating new review with tourId and userId automatically get from current logged in user authcontroller.protect
//router.route('/:tourId/reviews').post(authController.protect,authController.restrictTo('user'),reviewController.reviewCreate);

//!nested route with express feature called 'mergeParams:true' this mergeParams defines in 'reviewRoutes.js'
router.use('/:tourId/reviews', reviewRouter)// uper wala nested route same waisa hi kam karega bas wo tour id ko add kar dega reviewRoutes ke ander kyu ki waha mergeParams: true kiya hai jo ki express ka ek feature hai.

 module.exports = router;