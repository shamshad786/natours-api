const express = require('express');
const app = express();
const path = require('path');
const morgan = require('morgan');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const viewRouter = require('./routes/viewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler =  require('./controller/errorController');
const mongoose  = require('mongoose');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser =  require('cookie-parser');
const dotenv = require('dotenv');
dotenv.config()

//mongo connetion

//! Database Connection
mongoose.connect(process.env.MONGO_URI).then(() =>{
    console.log('Database connected');
});

//! set template engine pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

//!Global Midddlewares

// Set security HTTP headers
app.use(helmet());
//reading data from into req.body not accepting data more than 10kb from user
app.use(express.json({ limit: '10kb'}));
app.use(cookieParser())

//development log
console.log(`This Project Runs in____${process.env.NODE_ENV}____mode`)
if(process.env.NODE_ENV === 'development'){
app.use(morgan('dev'));
}

//!rate limiter
const limiter = rateLimit({
    max: 100,
    windowMs: 60*60*1000,
    message: 'Too many request from this IP, Please try agian in hour!'
});

app.use('/api', limiter);



//app.use(express.static(`${__dirname}/public`));



//!Data Sanitization against NoSQl query injection
app.use(mongoSanitize());

//!Data Santitization againt XSS(cross-site-scripting)
app.use(xss());

//!Preventing Parameter Pollution
app.use(hpp({
    whitelist:[
        'duration',
        'ratingQuantity',
        'rating',
        'maxGroupSize',
        'difficulty',
        'price'
    ]}
));


app.use((req,res,next)=>{
    //console.log('middleware user: ', req.locals)
    console.log('hello from middleware')
    next();
});

app.use((req,res,next)=>{
    req.requestTime =  new Date().toISOString();
   // console.log(req.requestTime)
  //console.log(x)
  console.log(req.cookies);
    next()
})

//! Routes

app.use('/',viewRouter)

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/review', reviewRouter);

app.all('*',(req,res, next)=>{
    // res.status(404).json({
    //     status: 'failed',
    //     message: `this ${req.originalUrl} is not found`
    // });

    // const err  = new Error(`unhandled error this ${req.originalUrl} is not found`);
    // err.statuscode =  404;
    // err.statuse = 'fail';

    next(new AppError(` AppError:  this ${req.originalUrl} is not found`, 404))
});

app.use(globalErrorHandler);

module.exports = app;