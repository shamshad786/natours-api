const User = require('../models/userModel');
const catchAsync = require('../utils/catchasync');
const jwt = require('jsonwebtoken');
const AppError  = require('../utils/appError');
const util = require('util');
const Email  = require('../utils/email');
const crypto = require('crypto');


const signJwtToken = (id) =>{
    return jwt.sign({id: id}, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN });
}

const cookieOptions = {
    expires: new Date(
        Date.now() + (30*24*3600000)//expire this cookie after one month
        ),// change date into millisecond
        httpOnly: true
};

if(process.env.NODE_ENV === 'production') cookieOptions.secure = true;


//! Create new user
exports.signup = catchAsync(async(req,res,nex)=>{
   // const newUser = await User.create(req.body);
    const newUser = await User.create({ //we accept these limited fields values for security reason for user can't registred him self as admin if user send admin role it'll not saved into database
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
       // passwordChangeAt: req.body.passwordChangeAt,
        role: req.body.role
    });
    const token = signJwtToken(newUser._id);
    //SEND JWT via cookie 
    res.cookie('jwtCookie', token, cookieOptions)
    //remove password field from response output when user created basically it's only hide that field
    newUser.password =  undefined

     //Send welcome email after register new user
    const url = `${req.protocol}://${req.get('host')}/me`;
    console.log(url);
    await new Email(newUser, url).sendWelcome();

    res.status(201).json({
        status: 'Success',
        token: token,
        data:{
            user: newUser
        }
    });
});

//! Login user

exports.loginUser = catchAsync(async (req,res,next)=>{

    const {email,password} = req.body;

    //1) check if email & passowrd is exist 
    if(!email || !password){
      return  next( new AppError('please provide email & password', 400));
    }

    //2) check if user exists & password is correct
    const user = await User.findOne({email: email}).select('+password'); // in this select function we get password for send response to the client because we hide the passowrd field from userModel as 'password: select: false'

    //this correctPassword is comming from userModel intance method that we were created for copmparing the user password we simply use this as object like this 'user.correctPassword' becuase it's availeble for all user document. we can use await this instance beacuse in our schmea this 'correctPassword' has async function.

   // const correct = await user.correctPassword(password, user.password)//!if we use like this when user email not found then this line of code is got null because 'user.password' is not available it throw server error. to prevent this we can put this in 'if(!user ||  !(await user.correctPassword(password, user.password))) like this for catch the operational error.

    if(!user ||  !(await user.correctPassword(password, user.password))){
        return next(new AppError('Invalid email & password', 401));
    }
    //3) if everything ok , send jwt token to the client
    const token = signJwtToken(user._id);

     //SEND JWT via cookie 
     res.cookie('jwtCookie', token, cookieOptions)

    res.status(200).json({
        status: 'success',
        token: token,
        data:{
            user
        }
    })
});


exports.isLoggedIn = catchAsync(async(req,res,next)=>{
    if(req.cookies.jwtCookie){
        //1) verify token
        const decoded = await util.promisify(jwt.verify)(req.cookies.jwtCookie, process.env.JWT_SECRET);

        //2)check if user still exist
        const currentUser = await User.findById(decoded.id);
        if(!currentUser){
            return next()
        }

        //3) Check if user changed password after the token was issued
        if(currentUser.changePasswordAfterTokenGen(decoded.iat)){
            return next()
        }
        res.locals.user = currentUser;

    }

    next()

})


exports.logout = (req,res)=>{
    res.cookie('jwtCookie', 'loggedout',{
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    })
    res.status(200).json({status: 'success'});
}


//! routes protecting middleware handler for checking user still logged in
exports.protect = catchAsync(async (req,res,next)=>{
    //!1) Getting jwt token and check of it's there
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1]

    }else if(req.cookies.jwtCookie){
        token =  req.cookies.jwtCookie
    }
    //console.log('Token: ', token);
    if(!token){
        return next(new AppError('You are not logged in. log in for get access', 401));
    }

    //!2) varification jwt token
    //we use promisify() function from node.js 'util' module for receving promise whether this jw.verify() return promise fullfil or not.
    const jwtDecodedToken = await util.promisify(jwt.verify)(token,process.env.JWT_SECRET)
    console.log('Decoded Jwt Token: ', jwtDecodedToken);
    // we send error to errorController for production if jwtsend verification error
    //we also handled jwt exprire token error in errorController
    
    //!3) check if the user still exists
    const currentUser = await User.findById(jwtDecodedToken.id);
    //console.log('current user protect middleware: ', currentUser)
    if(!currentUser){
        return next(new AppError('this user is not belonging to this token ',401))
    }

    //!4) check if the user change password after the token was issued
   if( currentUser.changePasswordAfterTokenGen(jwtDecodedToken.iat)){
    return next( new AppError('you\ve recently changed your password. log in again', 401));
   }
    //!Grant Access to the protected route and put our user data in request then we can used this letter in somewhere
    req.user = currentUser;
    next();
});


exports.restrictTo = (...roles) =>{// this rest operator store all users role here then if normal 'user' role present it gives error or if admin role exist it will perform this delete action. it's look like roles['admin', 'lead-guide'].role='user' 7 this 'admin' 'lead-guide' roles values comes from middleware tourRoutes we put there.
return (req,res,next)=>{
    //this 'include' are available for array which check ka array includes values here is our values is roles. in this include if 'user' role found it's gives error or if role found admin it'll call next() to perform delete action
    console.log('user role: ', roles.includes(req.user.role), req.user.role);

    if(!roles.includes(req.user.role)){
        return next(new AppError('you have not permission to perform this action', 403));
    }
    next()
}

}

//! reset password by clicking forget button
exports.forgetPassword =catchAsync(async (req,res,next)=>{ 
    //! 1. find user by email 

    const user = await User.findOne({email: req.body.email});
    if(!user){
     return  next(new AppError('There is no user with this email address ', 404));
    }

    //! 2. Generate Reset token for reseting password (we generate token intance in userModel then use it here )

        const resetToken =  user.createResetPasswordToken()
        await user.save({validateBeforeSave: false});

    //!3.creating reset url & send this token to the user email by nodemailer

    // const message = `Forgot your password ? submit a patch request with your new password and passwordConfirm to: ${resetUrl}.\n if you did'nt forgot your password, please ignore this email! `;
    
    try{
        // await sendEmail({
            //     email: user.email,
            //     subject: `Your password reset token (valid for 10 minutes)`,
            //     message: message
            // })
        const resetUrl =  `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`;
        await new Email(user, resetUrl).sendResetPassword()

    res.status(200).json({ 
        status: 'success',
        message: 'Token send to email !'
    })

    }catch(err){
        user.passwordResetToken =  undefined;
        user.passwordResetExpires =  undefined;
        await user.save({validateBeforeSave: false});

        return next(new AppError('There was an error sending email. Try again later !',500));
    }


})

//! reset password for after recieving forget password link 
exports.resetPassword = catchAsync(async (req, res,next)=>{
        //!1. Get user based on token

        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
       // console.log(hashedToken)
        //find user with token and not expiring the token with current time at same time.
        const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpires: {$gt: Date.now()}});

        //!2. if token has expired, and there is user exist, set the new password & passwordConfirm fields

        if(!user){
            return next(new AppError('Token is invalid or expired', 400))
        }
        user.password = req.body.password;
        user.passwordConfirm =  req.body.passwordConfirm;
        user.passwordResetToken =  undefined;
        user.passwordResetExpires =  undefined;
        await user.save();// we always use .save() method because in our schema model we used mongoose middleware which is always work with .save() & .create()

        //!3 Update changePassowordAt model field property for the user 
            //we created to update this 'passwordChangeAt' field update in mongoose userModel
            //eg:-
            // useSchema.pre('save', function(next){
            //     if(!this.isModified('password') ||  this.isNew) return next();
            
            //     this.passwordChangeAt =  Date.now() - 1000; 
            //     next();
            // })
        
        //!4 Log the user in, send JWT 
        const jwtToken = signJwtToken(user._id);
        res.status(200).json({
            status: 'success',
            token: jwtToken // then use this token to get all tour data
        })
})


//! user can update its own passsword without forgetting the password. this functionality only for logged in user.
exports.updatePassword =  catchAsync(async(req,res,next)=>{

    //1) get the user from database
    const user = await User.findById(req.user.id).select('+password');
    console.log('updated user password: ',user);

    //2) check if posted password & current password is correct
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))){
        return next( new AppError('Your password is wrong', 401));
    }
       
    //3) if password is correct update the password

    user.password =  req.body.password;
    user.passwordConfirm =  req.body.passwordConfirm;
    await user.save();
      
    //4) log user in, send jwt token
    const jwtToken = signJwtToken(user._id);
    res.status(200).json({ 
        status:'success',
        token: jwtToken
    })
    
})
