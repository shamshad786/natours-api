//review
//rating
//createdAt
//ref tp tour
//ref to user

const mongoose = require('mongoose');
const Tour = require('../models/tourModel');
const mongoDb = require('mongodb');

const reviewSchema = new mongoose.Schema({

    review:{
        type: String,
        required: [true, 'Review can not be empty']
    },
    rating:{
        type: Number,
        min: 1,
        max: 5
    },
    revCreatedAt: {
        type: Date,
        default: Date.now() 
    },

    //parent referencing tour and user
    tour:{
            type: mongoose.Schema.ObjectId,
            ref: 'Tour',
            required: [true, 'Review must belong to a tour']
        },

    user:{
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: [true, 'Review must belong to a user']
        }

},
{
    timestamps: true
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
}
);


reviewSchema.pre(/^find/, function(next){

    // this example for querying 2 populate fields
    // this.find().populate({
    //     path: 'tour',
    //     select: 'name'//this only show tour name field not complete tour data
    // }).populate({
    //     path: 'user',
    //     select: 'name photo' // this i sonly show user name and photo field data not complete user data
    // })


    this.populate({
        path: 'user',
        select: 'name photo'
    })
    next()
})

//! calculate average rating review statistics 

reviewSchema.statics.calcAverageRatings = async function(tourId){

    const stats = await this.aggregate([
        {
            $match: {
                tour: tourId
            }
        },
        {
            $group:{
                _id: '$tour',// this group by tour id this 'tour' tour field in this schema
                nRating: {
                    $sum: 1
                },
                avgRating: {
                    $avg: '$rating'
                }
            }
        }
    ])
    //console.log(stats)
    //! now update the tour 'ratingQuantity' & 'ratingsAverage' in tour model for getting how many review has and average rating
    if(stats.length > 0 ){
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: stats[0].nRating,
            ratingsAverage: stats[0].avgRating
        })
    }else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingQuantity: 0,
            ratingsAverage: 4.5
        })
    }
}

//! function here to calcuclate averages
reviewSchema.post('save', function(){

    // 'this' keyword points to current document
    this.constructor.calcAverageRatings(this.tour); // 'this' is current document and 'contructor' who create the document
    
})

//! only one user can do review at one tour. same logged in user can not do multiple reviews on same tour.
reviewSchema.index({ tour: 1, user: 1},{ unique: true});


//! define mongoose middlewares to calculate averages if user update or delete the reviews
reviewSchema.pre(/^findOneAnd/, async function(next){
   this.r = await this.model.findOne();
  // console.log('this.r PRE: ',this.r);
    next();
});

//! define mongoose middlewares to calculate averages if user update or delete the reviews
reviewSchema.post(/^findOneAnd/, async function(){
    //await this.findOne() does not work here because query already executed
   await  this.r.constructor.calcAverageRatings(this.r.tour);
});


const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
