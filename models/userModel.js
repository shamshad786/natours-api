const mongoose = require('mongoose');
const validator = require('validator')
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const useSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'user must have a name'],

    },
    email:{
        type: String,
        required: [true, 'user must have to provide email'],
        unique: true,
        validate: [validator.isEmail, 'please provide valid email'],
    },
    photo:{
        type: String,
        default: 'defult.jpg'
    },

    role:{
        type: String,
        enum:['user', 'guide', 'lead-guide', 'admin'],
        default: 'user'
    },

    password:{
        type: String,
        required: [true, 'Please provide password'],
        minlength: 8,
        select: false //this field will not show in output when we fetch all users from databse

    },
    passwordConfirm:{
        type: String,
        required: [true, 'Please confirm your password'],
        //this work only on '.create()' and  '.save()' method not on 'findOneAndUpdate()' 
        validate: {
            validator: function(el){
                return el === this.password
            },
            message: 'Password is not matched !'
        }
    },
    passwordChangeAt: {
        type: Date
    },
    passwordResetToken: String,
    passwordResetExpires: Date,

    active:{

        type: Boolean,
        default: true,
        select: false

    }

},{timestamps: true});

//! bcrypt the user password
//mongoose document middleware
useSchema.pre('save', async function(next){

    //this only run when password is modified 
    if(!this.isModified('password')) {
        return next();
    }
    //this hating the password with salt 12 round.
    this.password = await bcrypt.hash(this.password, 12);

    //this passwordConfirm is undefined for prevent validation in schema here we do not encrypt password and passwordConfirm 2 encryption. and remove passwordConfirm field while saving in database
    this.passwordConfirm = undefined
})


//! creating user login passowrd compare intance for all collection or documents & call this intance method function in authcontroller.js into the login handler
useSchema.methods.correctPassword = async function(candidatePassword, userPassword){
    // we can't do this here like this 'this.password' for compare user password because we select the password field as false for not showing in output hence we created this instance method and we give name this intance method is 'correctPassword', we can simply use this intance in auth login controller like 'user.correctPassword' because this instance are availe for all user documents.
    return await bcrypt.compare(candidatePassword,userPassword);
} 

//! create this intance for check user update the password after token generate
useSchema.methods.changePasswordAfterTokenGen = function(jwtTimeStamp){

    if(this.passwordChangeAt){

        const changeTimeStamp = parseInt(this.passwordChangeAt.getTime() /1000, 10);// we divide this by 1000 because this 'passwordChangeAt' change in miliseconds and it more than 1000 time of 'jwtTimeStamp' hence we divide this to make it similar timestamp and we put 10 to get 10 digits to number in  milliseconds
    
        //console.log(changeTimeStamp, jwtTimeStamp)

        return jwtTimeStamp < changeTimeStamp; // eg if time 100 < 200 'true' means password change, and if 300 < 200 'false' means user not changed his password. if we get true send error response to client user changed his password log in again.
    }

    //false means user not changed his password
    return false
};

//! update passwordChangeAt property for user time when user has updating the password.
useSchema.pre('save', function(next){
    if(!this.isModified('password') ||  this.isNew) return next();

    this.passwordChangeAt =  Date.now() - 1000; // we minus (1 second) 1000 millisecinds because saving the this time in database is slower then creating jwt token creation. when the token compare the timing it'll be incorrect and user can't be log in hence we try little hack to minus 1000 milliseconds to matching the validation condition.
    next();
})



//! passwordResetToken instance 
useSchema.methods.createResetPasswordToken =  function(){
    // we create crypto hexa decimat random strting for reseting token and stored it into databse. why we create this token ? beacuse if hacker attack into database hacker can't guess the user token for reseting user password.
    const resetToken = crypto.randomBytes(32).toString('hex');// this is original token
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')// this is encrypted original token & this token save into databse.

    console.log('Crypto Reset Token:  ', resetToken, ' this.passwordResetToken: ',  this.passwordResetToken);
    //now expires this resetToken after 10 mint because user have only 10 mints to reset our under this is time. let add 10 mints more after generating resetToken. but this 10 mint should be milliseconds so do this by adding 10 its minuts, * 60 its seconds, *1000 it's 1000 millisonds this formula converting 10 minutes into milliseconds.
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000

    //then we have to return plain text token for sending on mail for reseting the token
    return resetToken;

}

//! find users only who has 'active:true' only active users list cant fecth and 'active:false' will not fetch
useSchema.pre(/^find/, function(next){
    this.find({active:{$ne: false}});
    next();
})



const User =  mongoose.model('User', useSchema)

module.exports =  User;
