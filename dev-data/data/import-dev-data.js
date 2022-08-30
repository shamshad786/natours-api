const fs= require('fs');
const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(() =>{
    console.log('Database connected from import-dev-data');
}).catch(err=>{
    console.log('Database Not Connected');
});


//! Reading a JSON file

const tours = fs.readFileSync(`${__dirname}/tours.json`, 'utf-8');
const user = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));


const jsonTours = JSON.parse(tours);

//! Import Data into database

const importData = async()=>{
   try{
    await Tour.create(jsonTours);
    await User.create(user, {validateBeforeSave: false});
    await Review.create(reviews);

    console.log('Data Uploaded Successfully');
}catch(err){
    console.log(err)
}
process.exit(); // it stop the server after process complete 
}

//! Delete all Existing data from database

const deleteData  = async()=>{
    try{

        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();

        console.log('All Data deleted')
    }catch(err){
        console.log(err);
    }
    process.exit();
}

//console.log(process.argv); // this argv ki node process log its accepts arrays they accept node option as array

if(process.argv[2] === '--import'){
    importData()
}else if(process.argv[2] === '--delete'){
    deleteData()
}

//!import
//! run this command in terminal :- 'node dev-data/data/import-dev-data.js --import' for importing data from databse it will match with process.argv to '--import' then it will call only 'importData()' from terminal command


//!delete
//! run this command in terminal :- 'node dev-data/data/import-dev-data.js --delete' for deleting data from database it will match with process.argv to '--delete' then it will call only 'deleteData()' from terminal command

console.log(process.argv);