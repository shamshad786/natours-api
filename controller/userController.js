const fs = require('fs');
const AppError  = require('../utils/appError');
const catchAsync = require('../utils/catchasync');
const User = require('../models/userModel');
const multer = require('multer');
const sharp =  require('sharp')


const fetchUsers = fs.readFileSync(`${__dirname}/../dev-data/data/users.json`, 'utf-8', (err,data)=>{
    if(err){
        return console.log('error in fecthing users');
    }
    return data
})
const jsonUsersParsed =  JSON.parse(fetchUsers);

//! Multer Configuration
//!this is Multer original image file save into diskStorage without compress
// const multerStorage = multer.diskStorage({
//     destination: (req,file,cb)=>{
//         cb(null, 'public/img/users');
//     },
//     filename: (req,file,cb)=>{
//         //mimetype: images/jpeg we split the extention then select 2nd array image extenstion name
//         const ext = file.mimetype.split('/')[1];
//         //we create file name like thi 'user-6223dchjr5544-472748282.jpeg'
//         cb(null, `user-${req.user.id}-${Date.now()}.${ext}`)
//     }
// });
//! we save store image file in memory not in diskStorage we create this memory for 'sharp()' method because we store image in memory as buffer 'req.file.buffer', save image with compress image run after 'resizeUerPhoto' middleware
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
//'photo' ye field name se image send karenge postman se agar post me 'file' likh diya aur yaha 'photo' likh denge to error aa jayega photo bhejne ki field same honi chahiye
exports.uploadUserPhoto = upload.single('photo') 

//! image resize middleware
exports.resizeUerPhoto =  catchAsync(async (req,res,next)=>{
    if(!req.file) return next();
    //filename not define but we need this file name so we redefine 'filename' here as again like 'req.file.filename'
    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`
    console.log(req.file)

    //!req.file.buffer (we save image in local memory in multer memory storage it store image as memory buffer)
    // we store image file into memory buffer not in diskStorage, then we resize 500x500(square image) and format to only change in 'jpeg', and compress the quality to 90% the jpeg({}) accept compress value quality as object. then we save resized in our disk hence we use .toFile() this '.toFile()' needs the entire path of the file eg; 'public/img/users/'-> this is our folder location where do we want to save our file & '${req.file.filename}' -> this is image filename what we want to store in disk. 
  await sharp(req.file.buffer).resize(500, 500).toFormat('jpeg').jpeg({quality: 90}).toFile(`public/img/users/${req.file.filename}`)

    next();
});

 //! filtered Object testing code
//  const body = {
// 	name: 'sam',
// 	email: 'sam@gmail',
// 	role: 'admin',
// 	car: 'ertiga'
// }


// const filterObj = (obj, ...allowedFields)=>{
// //	console.log('obj: ', obj)
// //	console.log('allowed fields: ', ...allowedFields)
// //	console.log('object key',Object.keys(obj))
// 	const newObj = {};
// 	Object.keys(obj).forEach(el => {
// 		//console.log('forEach: ', el)
// 		if (allowedFields.includes(el)) newObj[el] = obj[el];
// //		console.log('allowedField incliude: ', allowedFields.includes(el))
// //		console.log('newObj: ', newObj[el])
// //		console.log('obj el: ',obj[el])
// //		console.log('match newObj = obj: ',newObj[el] = obj[el])
// 	});
// 	return newObj;
// }

// const filteredBody =  filterObj(body, 'name', 'email');
// console.log(filteredBody);


//! we the incoming fields from user name,email, role its will update the all user data include roles. user can simply set its role='admin' so this is big mistake hence we created this 'filteredObj' function that can allow user only update it's name and email while this function like this: 'const filteredBody =  filteredObj(req.body, 'name', 'email')' only given fileds name user can update.

const filteredObj = (obj, ...allowedFields) => {
    const newObj = {}
        Object.keys(obj).forEach(el =>{
            if(allowedFields.includes(el)){
                console.log('filtered obj: ', el);
                newObj[el] = obj[el]
            }
        })
        return newObj;
}

//! single user only updates it's own name and email only not password,role anything else

exports.updateMe =  catchAsync(async(req,res,next)=>{

    // console.log(req.file)
    // console.log(req.body)

    if(req.body.password ||  req.body.passwordConfirm){
        return next(new AppError('password update not allowed here. go /updatemypassword',400))
    }

    //in this case here .save() method not works becuase in our userModel Schema we have many validation for passwords and it's required fields and it is sensitive data & here in this controller we not dealing with passowords fields so this .save() not works thse solution is .findByIdAndUpdate() is works for here beaucse it updating the data by id.
//     const user = await User.findById(req.user.id);
//     user.name =  'sam';
//    await  user.save();

const filteredBody =  filteredObj(req.body, 'name', 'email')

//check if imgae file exist just save image filename into 'photo' schema field
if(req.file) filteredBody.photo =  req.file.filename

//we 'runValidators: true' because in userModel Schema is has validation if user put wrong email then validator runs if we not set 'runValidators: true' then user will update wrong email for preventing this we have to set this.
const updateUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runValidators: true});
    res.status(200).json({
        message: 'success',
        data: {
        user: updateUser
        }
    })

} );


//! deleting the user it's account 
exports.deleteMe = catchAsync(async(req,res,next)=>{
    await User.findByIdAndUpdate(req.user.id, {active: false});
    res.status(204).json({
        status: 'success',
        data: null
    });
})



 exports.getAllUsers = async(req,res)=>{

    // if(jsonUsersParsed){

    //     res.status(200).json({
    //         status: 'success',
    //         totalUser: jsonUsersParsed.length,
    //         data:{
    //             users: jsonUsersParsed
    //         }
    //     })

    const users = await User.find();
    res.status(200).json({
        status:'success',
        data:{
            users
        }
    })

    // }else{

    //     res.status(500).json({
    //         status: 'error',
    //         message: 'this not define yet'
    //     });
    // }
 }



 exports.getMe = (req,res,next)=>{
    req.params.id = req.user.id;
    next()
 }

  exports.createUser = (req,res)=>{
     res.status(500).json({
         status: 'error',
         message: 'this not define yet'
     })
 }

  exports.getUser = catchAsync(async(req,res,next)=>{
    const singleUser = await User.findById(req.params.id).select('-password -passwordChangeAt ');
    if(!singleUser){
        return next(new AppError('no user found with that id', 404));
    }
    res.status(200).json({
        status: 'success',
        data:{
            data: singleUser
        }
    })
  });

  exports.updateUser = (req,res)=>{
     res.status(500).json({
         status: 'error',
         message: 'this not define yet'
     })
 }
 
  exports.deleteUser = (req,res)=>{
     res.status(500).json({
         status: 'error',
         message: 'this not define yet'
     })
 }