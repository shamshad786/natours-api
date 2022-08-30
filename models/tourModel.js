const mongoose  = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
//const User = require ('./userModel');

const tourSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'A tour must have a name'],
        unique: true,
        trim: true,
        maxlength: [40, 'A name should be less or equal to 40 characters'],
        minlength: [10, 'A name should be greater or equal to 10 characters']
        //validate: [validator.isAlpha, 'The tour name must only characters'],
    },

    slug: { 
        type: String
    },

    duration:{
        type: Number,
        required: [true, 'A tour must have a duration']
    },
    maxGroupSize:{
        type: Number,
        required: [true, 'A tour must have a max froup size']
    },
    difficulty:{
        type: String,
        required: [true, 'A tour must have a difficulty'],
        enum:{
            values: ['easy', 'medium', 'difficult'],
            message: 'Difficulty is either: easy, medium, difficult'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) /10 // val -> 4.66666, *10 -> 46, /10 -> 4.6 
    },

    ratingQuantity:{

        type: Number,
        default: 0
    },

    price: {
        type: Number,
        required: [true, 'A tour must have a price']
    },
    priceDiscount:{
        type: Number,
        validate: {
            validator: function(val){
                return val < this.price
            },
            message: 'Discount price is not valid ({VALUE})'
        }
    },
    summary:{
        type: String,
        trim: true,
        required: [true, 'A tour must have a description']
    },
    description:{
        type: String,
        trim: true
    },
    imageCover: {
        type: String,
        required: [true, 'A tour must have a image cover']
    },
    images: [String],
    createdAt:{
        type: Date,
        default: Date.now()
    },
    startDates: [Date], 
    //geospatial schema field
    startLocation:{
        //it accept geoJSON data, this is not a document it self it's normal object
        type:{
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
        description: String
    },
    locations: [// this is document we created here we create here array because leter we embade it into another document, for embedding the documents we always need to use as array
        {
            type:{
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number],
            address: String,
            description: String,
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        }
    ],

    secretTour:{
            type: Boolean,
            default: false
    }
},{
    toJSON: {virtuals: true},// this should be put here when we user virtual properties mongoose middleware
    toObject: {virtuals: true}
});

//!virtual Properties
tourSchema.virtual('durationWeeks').get(function(){
    return this.duration / 7 ;
});
//! for creating index in mongo index
//tourSchema.index({price: 1}) //1 is ascending order and -1 decending order
tourSchema.index({price: 1, ratingAverage: -1}) //1 is ascending order and -1 decending order
tourSchema.index({ slug: 1})
tourSchema.index({startLocation: '2dsphere'}); // this is real point of earth surface so we're going to use a 2D sphere index here.


//! virtual Populate for get access of reviews while using of parent refrencing
tourSchema.virtual('reviews',{
ref: 'Review', //this is reference of review model 
foreignField: 'tour',// this connect revieModel with tour field & its only save tour field _id in localField
localField: '_id'// we store this '_id' in our virtual propulate('reviews')
//and then we have to populate our this 'virtual 'reviews' in only single tour document fetch not in all document fetch go to tour controller and populate 'reviews' on finding single document like this :   const singleTour = await  Tour.findById(req.params.id).populate('reviews')
})


//! Document Middleware and its runs befre .save() command and .create()
tourSchema.pre('save', function(next){
    //console.log('Document middleware runs before save: ',this)// this this keyword only point to the currently process documents. this why its called document middleware
    this.slug = slugify(this.name, {lower: true});
    next();
})

// tourSchema.pre('save', function(next){
//     console.log('its run before save the documents in database')
//     next()
// })

// tourSchema.post('save', function(docs, next){
// console.log(docs)
//     next()
// })


//! save user id or embedding user id in 'guides' field as array of user id list 
// tourSchema.pre('save', async function(next){
    // we use here promise.all() because this.guide.map is returning full of promises so that we have to consume that promises for hence we use here promise.all() for awaiting this and then save user id as array of list in guide field,
    //this 'this.guides.map(async  id => await User.findById(id))' not only find user id but this will find user by id and save his complete data in database with this tour data in guide field. this only works for creating new document not updating the document. but this embedding has some drawbacks it reach the 16mb limit soon and its create long array list.
//     const guidesPromise = this.guides.map(async  id => await User.findById(id))
//     this.guides = await Promise.all(guidesPromise);
//     next()
// });

//! populate() method for show complete data of mongoose.Schema.ObjectId. in our case we save ObjectId in 'guides' field
tourSchema.pre(/^find/, function(next){
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangeAt'
    })
    next()
})


//! Query Middleware
//tourSchema.pre('find',function(next){
tourSchema.pre(/^find/,function(next){
this.find({secretTour : {$ne: true}});
this.start = Date.now();
    next();
});


tourSchema.post(/^find/,function(docs, next){
   // console.log(docs);
    console.log(`Qyery took ${Date.now() - this.start} milliseconds`);
    next();
});


//!Aggregation Middleware
// tourSchema.pre('aggregate',function(next){
//     this.pipeline().unshift({$match: {secretTour: {$ne: true}}});
//     console.log('aggregation middleware',this.pipeline());
//     next();
// });

const Tour = mongoose.model('Tour', tourSchema);

 module.exports = Tour;