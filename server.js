
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
    server.close(()=>{// server close allows to process the all pending requests
        process.exit(1)
    });
});


//!receive sig term signal from heroku because heroku use 'deno' container which is our application running every 24 hourse deno restart the application to maintain our application healthy so we have to handle 'sigtermsignal' shutting down application after complete all pending requests

process.on('SIGTERM',()=>{
console.log('SIGTERM Received. shutting down gracefully');
server.close(()=>{//server close allows to process the all pending requests
    console.log('process terminal')
   // process.exit(1) we are not close this server by our self beacuse deno do that by itself
})

});





