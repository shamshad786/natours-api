
//! unhandled exception is all error bugs in our code that can't not be handled any where
process.on('uncaughtException', err =>{
    console.log('UNCOUGHT EXCEPTION 🐡: ERROR')
    console.log(err.name, err.message)
    console.log(err)
    process.exit(1)
});

const app = require('./app');


const port = process.env.PORT || 4000;
const server = app.listen(port,()=>{
    console.log(`Server Running on ${port}`)
})

//! unhandled rejection from outside of aplication in our case mongodb connection error.
process.on('unhandledRejection',err=>{
    console.log(err.name, err.message)
    console.log('APPLICATION SHUTTING DOWN')
    server.close(()=>{
        process.exit(1)
    });
});





