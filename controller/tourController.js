const fs = require('fs');
const Tour = require('../models/tourModel');
const APIfeatures = require('../utils/apiFeatures')
const catchAsync =  require('../utils/catchasync');
const AppError = require('../utils/appError');
const factory = require('./factory');
const multer = require('multer');
const sharp =  require('sharp')


//_______________________________________________________
//! multer upload multiple images
const multerStorage =  multer.memoryStorage();

    //here we created multer filter that user can only upload image not other files
    const multerFilter = (req,file,cb)=>{
        if(file.mimetype.startsWith('image')){
            cb(null, true)
        }else{
            cb(new AppError('This is not an image file, please upload only image', 400), false)
        }
    }

//now user multer option here as object
const upload =  multer({
    storage: multerStorage,
    fileFilter: multerFilter
});


exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount: 1},
    {name: 'images', maxCount: 3}
]);

//agar single image upload karna ho to 'upload.single()' likh ke uske ander 'name' field pass kar denge jis name se image aayega
//upload.single('images') //console.log(req.file)

//aur agar multple image pass karna ho to 'upload.array()' likh ke uske ander 'name' field pass kar denge jis name se images array me aayengi aur max value '5' pass kar denge jissye maximum 5 images hi upload hongi ek sath
//upload.array('images', 5) //console.files(req.files)

//exports.uploadTourImages = upload.array('images', 3);


//! images resize and compress and save multiple images to diskStorage(in file system) this is middleware


exports.resizeTourImages = catchAsync(async(req,res,next)=>{
    
    console.log(req.files)

    if(!req.files.imageCover || !req.files.images) return  next();

    //!1) Process image cover 
    const imageCoverFilename =  `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)//it accept size in pixels
    .toFormat('jpeg')
    .jpeg({quality: 90})// it accept value in percentage '%'
    .toFile(`public/img/tours/${imageCoverFilename}`);

    //store imageCover filename into databse directly from body it accept this data beacuse in 'updateTour' controller we put there req.body which means it accept entire data direclty from req.body
    req.body.imageCover =  imageCoverFilename;

    //!2) Process image
    //we need this empty array to push filename from loop
    req.body.images = [];

    //we need 'Promise.all()' for await each images process. if we don't consume promises the next() method call  and before process complete. and images field will remail empty hence we need to consume each promises with 'Promise.all()'
    //we user .map() function for save 3 three promises of 3 images process and consume all 3 images promises with Promis.all() & then move to next()
   await Promise.all( req.files.images.map(async (file, i)=>{
        //we need this filename for push into images[] array beause in our schema model images accept array
        const filename =  `tour-${req.params.id}-${Date.now()}-${i +1}.jpeg`

        await sharp(file.buffer)
        .resize(2000, 1333)//it accept size in pixels
        .toFormat('jpeg')
        .jpeg({quality: 90})// it accept value in percentage '%'
        .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename)
    })
   );
    next()
})


//__________________________________________________________


// const tourData = fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`,'utf-8', (err,data)=>{
//     if(err) return res.status(404).send('file not found');
//     const jData = data;
//     return jData
// });

//const tourJsonData =  JSON.parse(tourData);


//! ye middleware object ke id ko url pr hit karne se pehle check kar lega id valid hai ki nahi...agar id valid nahi hui to ye middleware next() ko call nahi karega...aur agar id valid hua to next() call ho jayega aur middleware aagey kam karega.
/*
exports.checkId = (req,res,next,val){
    console.log('Tour Id: ', val);
    if(req.param.id *1 > tourJsonData.length){
        return res.status(404).json({
            status: failed,
            message: 'Invalid ID'
        })
    }

    next()
}
*/


// exports.checkTourBody = (req,res,next)=>{
//     if(!req.body.name || !req.body.price){
//         return res.status(400).json({
//             status: 'failed',
//             message: 'missing data'
//         })
//     }
//     next();
// }

//! create tour
//exports.createTours = async(req,res)=>{

/*
// this is old method to create new object in local json file in directory
    const newId =  tourJsonData[tourJsonData.length - 1].id + 1;
    console.log(newId)
  
  const newTour = Object.assign({id: newId}, req.body);
  tourJsonData.push(newTour);
  
  fs.writeFile(`${__dirname}/../dev-data/data/tours-simple.json`, JSON.stringify(tourJsonData), (err)=>{
      if(err) return console.log(err);
      res.status(201).json({
          status: 'success',
          data:{
              tour: newTour 
          }
      })
  })
  */

//     try{
//         const tourData = req.body

//         const tourSavedData = await Tour.create(tourData);

//         res.status(201).json({
//             status: 'Success',
//            data:{
//                tour: tourSavedData
//            }
//         })

//     }catch(err){
//             res.status(400).json({
//                 status: 'failed',
//                 response: err
//             })
//     }

//   }
 

  //!catchAsync function (catchAsync function created in separate file and used it here)

  exports.createTours = catchAsync(async(req,res,next)=>{
    const newTour =  await Tour.create(req.body);
    res.status(201).json({
        status: 'success',
        data:{
            tour: newTour
        }
    })
  })


  exports.aliasTours = async(req,res,next)=>{//! this is middleware
    
    req.query.limit = '5';
    req.query.sort = '-rating,price';
    req.query.fields = 'name,price,summary,rating,difficulty';
    
    next()
  }

// i have save class APIfeature in utils folder and used it here



exports.getAllTours = catchAsync(async(req,res,next)=>{

  //  console.log('this is user comne from protected middleware: ',req.user)
   // console.log(req.requestTime);

    // res.status(200).json({
    //     status: 'success',
    //     requestedAt: req.requestTime,
    //     results: tourJsonData.length,
    //    data: {
    //        "tours": tourJsonData
    //    }
    // })
   
   // try{
        
        //! Building The Query
        
        console.log("Qyery From Body: ",req.query)

        // const queryObj = {...req.query}
        // const excludedFields = ['page','limit','sort','fields'];
        // excludedFields.forEach(el => delete queryObj[el]);
        // // console.log()

        // Advance Filtering Query
        // let queryStr = JSON.stringify(queryObj);
        // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}` );
        // const queryStrJson = JSON.parse(queryStr)
        // console.log('QueryStr: ',queryStrJson)


        // const Tours = await Tour.find(req.query).lean();
        // //   const Tours = await Tour.find().where('duration').equals(5).where('difficulty').equals('easy');
        // let query = Tour.find(queryStrJson);

        //sorting 
        // if(req.query.sort){
        //     const sortBy = req.query.sort.split(',').join(' ');
        //     query =  query.sort(sortBy)
        // }else{
        //     query = query.sort('-createdAt')
        // }
        
        //limiting
        // if(req.query.fields){
        //     const fields = req.query.fields.split(',').join(' ');
        //     query =  query.select(fields);
        // }else{
        //     query = query.select('-__v');
        // }

        //pagination
        // const page =  req.query.page * 1 || 1;
        // const limit = req.query.limit *1 || 100;
        // const skip = (page -1) * limit;

        // query = query.skip(skip).limit(limit);

        // console.log('Page No: ',page);
        // console.log('Limit: ', limit);

        // if(req.query.page){
        //     const numTours = await Tour.countDocuments();
        //     console.log('Count Documents',numTours);
        //     if(skip >=  numTours){
        //         throw new Error('This Page Not Found');
        //     }
        // }

        //TODO: Call Class objects here and their functions

        const features = new APIfeatures(Tour.find(), req.query);
        features.filter()// these function inside the class
        features.sort();
        features.limitFields();
        features.pagination();

        // execute th query
       // const tours = await query;
      // const tours = await features.query.explain();//! this is explain() method show all macthed query documents index and how many document exact macthes
       const tours = await features.query;//! this is class query define in class as this.query

     //! sending response
         res.status(200).json({
        status: 'success',
        results: tours.length,
       data: {
           "tours": tours
       }
    })

    // }catch(err){
    //     console.log(err);
    //     res.status(404).json({
    //         status: 'failed',
    //         message: err
    //     })

    // }
})


exports.getSingleTours = catchAsync(async(req,res,next)=>{
//     const id = req.params.id
//     const nId =  id * 1;
//     //const nId =  parseInt(id);
//    const tour = tourJsonData.find((el)=>{
//        return  el.id === nId
//    });
//    //console.log(tour)
//    if(tour){
//     res.status(200).json({
//         status: 'success',
//         data: {
//             tours: tour
//         }
//     })
//    }else{
//     res.status(404).json({
//         status: 'failed',
//        message: 'not found'
//     })
//    }

//try{

   // const getTour = req.params.id
   //this .populate() method fetch all complete data which is saved in our database as 'mongoose.Schema.ObjectId' it just accept field name of where your store data as  'mongoose.Schema.ObjectId' form your schema model. when you just .populate('guides') like this. in response you'll see the complete details of 'mongoose.Schema.ObjectId'. and this .populate() method also accept object where you can put multiple objects field for querying the data. path: 'guides'  always reference the 'mongoose.Schema.ObjectId' and 'select' is used fro removing fields while fecthing the data. important: one thing to keep in our mind behind the scene using the 'populate()' still create a new query this might affect our performance in small application its not big deal. but in huge application it will huge affect because there is tons of populate query send by many users. 
    const singleTour = await  Tour.findById(req.params.id).populate('reviews')
    // .populate(
    //    {
    //     path: 'guides',
    //     select: '-__v -passwordChangeAt'
    //    }
    // );//
    //Tour.findOne({_id: req.params.id}) this is exact same way to find the single document

    if(!singleTour){
        
        return next(new AppError(`ERROR: No Tour Is Found With That ID: ${req.params.id}`, 404))
    }

    res.status(200).json({
        status: 'success',
        data:{
            tour: singleTour
        }
    })
// }catch(err){
//     res.status(404).json({
//         status: 'fail',
//         message: err
//     })
// }
})


exports.updateTour = catchAsync(async(req,res,next)=>{
    // if(req.params.id * 1 > tourJsonData.length){
    //     res.status(404).json({
    //         status: failed,
    //         message: 'No data found'
    //     })
    // }else{
    //     res.status(201).json({
    //         status: 'success',
    //         message: 'data updated'
    //     })
    // }

   // try{
        const updateTour = await Tour.findByIdAndUpdate(req.params.id, req.body,{
            new: true, 
            runValidators:true
        });

        if(!updateTour){
            return next(new AppError(`ERROR: No Tour Is Found With That ID: ${req.params.id}`, 404));
        }

        res.status(201).json({
            status: "Success",
            data:{
                updatedTour: updateTour
            }
        })
    // }catch(err){
    //     res.status(500).json({
    //         status: 'failed',
    //         message: err
    //     })
    // }
})

//! delete factory handler function

exports.deleteTour = factory.deleteOne(Tour)

//exports.deleteTour = catchAsync(async(req,res,next)=>{

//     const id = req.params.id * 1;
//    // console.log(id)

//    const delTour =  tourJsonData.filter((el)=>{
//   //  console.log(el.id)
//         return el.id != id;
//     });

//    // console.log(delTour)
//     tourJsonData.push(delTour);

//     if(id  > tourJsonData.length){
//       //  console.log('ID: ',id)
//       return  res.status(500).json({
//             status: 'failed',
//             message: 'no data found for delete'
//         })
//     }else{
//         res.status(204).json({
//             status: 'success',
//             message: 'data deleted',
//             data:{
//                 tour: tourJsonData
//             }
//         });
//     }

   // try{
    //! factory handler se pehle ye wala code real hai
        // const deletedTour = await Tour.findByIdAndDelete(req.params.id,{
        //     new: true
        // });

        // if(!deletedTour){
        //     return next(new AppError(`ERROR: No Tour Is Found With That ID: ${req.params.id}`, 404))
        // }

        // res.status(200).json({
        //     status: 'success',
        //     message: ' tour deleted',
        //     data:{
        //         delData: deletedTour
        //     }
        // });   
        //! yaha tak     
    // }catch(err){
    //     res.status(500).json({
    //         status: 'failed',
    //         message: err
    //     })
    // }
//})

exports.getTourStats = catchAsync(async(req,res,next)=>{
   // try{
        const stats = await Tour.aggregate([
            {
                $match: {rating: {$gte: 4.5} }
            },
            {
                $group: {
                   // _id: "$difficulty",
                    _id: {$toUpper: '$difficulty'},
                    numTours: {$sum: 1},
                    numRating: {$sum: '$ratingQuantity'},
                    avgRating: { $avg : '$rating' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }
                }
            }, 
            {
                $sort : {avgPrice : 1}
            },
            // {
            //     $match: { _id: {$ne: 'EASY'}}// it will hide easy fields all collection
            // }
        ]);
        res.status(200).json({
            status: 'success',
            data:{
                stats: stats
            }
        })
    // }catch(err){
    //     res.status(500).json({
    //         status: 'failed',
    //         message: err
    //     });
    // }
})


exports.getMonthlyPlan = catchAsync(async(req,res,next)=>{
  //  try{
        const year = req.params.year * 1;//2021 we type
       // console.log('year: ', year)
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match: {
                    startDates: {
                        $gte: new Date(`${year}-01-01`), //! 2021-01-01 >=
                        $lte: new Date(`${year}-12-31`), //! 2021-12-31 <=
                    }
                }
            },
            {  
                $group: {
                    _id: { $month: '$startDates' },
                    numToursStarts: { $sum: 1 },
                    tours: {$push: '$name'},
                }
            },
            {
                $addFields: {month: '$_id'}
            },
            {
                $project: {
                    _id: 0
                }
            },
            {
                $sort: {numToursStarts: -1}
            },
            // {
            //     $limit: 6
            // }
        ]);
        res.status(200).json({
            status: 'success',
            data:{
                stats: plan
            }
        })
    // }catch(err){
    //     res.status(500).json({
    //         status: 'failed',
    //         message: err
    //     });
    // }
})


exports.getToursWithin = catchAsync(async(req,res,next)=>{
//! this handler routes accept data like this
    // /tours-within/:distance/center/:latlng/unit/:unit
    // /tours-within/233/center/34.111745,-118.113491/unit/mi

    const {distance, latlng, unit} = req.params

    const  [lat,lng] = latlng.split(',');

    //calculate earth radius if the 'unit' values comes from param in miles then divide the distance by 3963.2 & if the 'unit' values comes in kilometer then divide the distance by 6378.1; we divide this vlaues because mongoDb '$centerSphere' accept radius data into radians. and radians we get dividing the distance by the radius of the earth. 
    const radius = unit ==='mi' ? distance /  3963.2 : distance / 6378.1;

    if(!lat || ! lng){
        return next (new AppError('please provide the latitude and longitute in fromat lat,lng', 400));
    }

//$geoWithin -> it find the documents within certain geometry. where to find these documents we want to find them inside of sphere that starts tha points 'latlng' and radius of the 'distance' we defined.
//$centerSphere -> it takes an array coordinates(latitude and longitude) and of the radius. and it always define 'longitude' first and then 'latitude'   

  const tours = await Tour.find({startLocation: {$geoWithin: {$centerSphere: [[lng, lat], radius]}}});

    res.status(200).json({
        status: 'success',
        results: tours.length,
        data:{
            data: tours
        }
    });

});


exports.getDistances = catchAsync(async(req,res,next)=>{

    const {latlng, unit} = req.params

    const  [lat,lng] = latlng.split(',');

    //calculate distance from meter to mile or kilometers. because distance gives output in meters 
    const multiplier = unit === 'mi' ?  0.000621371 : 0.001

    if(!lat || ! lng){
        return next (new AppError('please provide the latitude and longitute in fromat lat,lng', 400));
    }

    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near:{
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance',// this give distance result in meter 
                distanceMultiplier: multiplier
            }
        },
        {
            $project:{ // this project stage only show the fields that given below rest of the data will hide.
                distance: 1,
                name: 1
            }
        }
    ])

    res.status(200).json({
        status: 'success',
        data:{
            data: distances
        }
    });

});