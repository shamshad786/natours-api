const catchAsync =  require('../utils/catchasync');
const Review = require('../models/reviewModel');
const AppError  = require('../utils/appError');
const factory = require('./factory');

//! create a review

exports.setTourUserId = (req,res,next)=>{

    if(!req.body.tour) req.body.tour  = req.params.tourId
    if(!req.body.user) req.body.user = req.user.id// this is user id comes from authcontroller.protect  

    next();
}


exports.reviewCreate = catchAsync(async (req,res,next) =>{

    const review =  await Review.create(req.body);

    if(!review){
        next( new AppError('You are not allowed to create review log in first', 401));
    }
    res.status(201).json({
        status: 'success',
        data:{
            review
        }
    })

});

//! Get all reviews

exports.reviewGet = catchAsync(async (req,res,next)=>{

    let filter = {};
    if(req.params.tourId) filter =  {tour: req.params.tourId} ;

    const reviews = await Review.find(filter).sort({_id: -1});

    if (!reviews || reviews.length == 0){

            next(new AppError('no reviews found', 404));
        }
        res.status(200).json({
            status: 'success',
            totalReview: reviews.length,
            data: {
                reviews
            }
        });
});


//! get one review with factroy function
exports.getReview = factory.getOne(Review);

//! update review with factory function
exports.updateReview = factory.updateOne(Review);

//! delete review with factory function
exports.deleteReview = factory.deleteOne(Review);