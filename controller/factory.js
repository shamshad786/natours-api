const catchAsync =  require('../utils/catchasync');
const AppError = require('../utils/appError');
const APIfeatures = require('../utils/apiFeatures')


//! delete one factory function
exports.deleteOne = Model => catchAsync(async(req,res,next)=>{

    const doc = await Model.findByIdAndDelete(req.params.id);

    if(!doc){
        return next (new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
        status: 'success',
        data: null
    });
});

//! update one factory function
exports.updateOne = Model => catchAsync(async(req,res,next)=>{

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body,{
        new: true, 
        runValidators:true
    });

    if(!doc){
        return next(new AppError(`ERROR: No Document Is Found With That ID: ${req.params.id}`, 404));
    }
    res.status(201).json({
        status: "Success",
        data:{
            data: doc
        }
    })
});

//! create one factory function
exports.createOne = Model => catchAsync(async(req,res,next)=>{
    const doc = await Model.create(req.body);
    res.status(201).json({
        status: 'success',
        data:{
            data: doc
        }
    })

});

//! get one factory function
//i've only use this in reviewController
exports.getOne = (Model, popOptions) => catchAsync(async (req,res,next)=>{
    let query = Model.findById(req.params.id);
    if(popOptions){
        query = query.populate(popOptions);
    }
    const doc = await query;
    if(!doc){
        return next (new AppError('no document found with that id', 404));
    }

    res.status(200).json({
        status: 'success',
        data:{
            data: doc
        }
    })
})

//! get all tour factory function
//i created here but never call this anywhere

exports.getAll = Model => catchAsync(async (req,res,next)=>{

    const features = new APIfeatures(Model.find(), req.query);
    features.filter()// these function inside the class
    features.sort();
    features.limitFields();
    features.pagination();

    // execute th query
   // const tours = await query;
    const doc = await features.query;//! this is class query define in class as this.query

 //! sending response
     res.status(200).json({
    status: 'success',
    results: doc.length,
   data: {
       "data": doc
   }
})

});