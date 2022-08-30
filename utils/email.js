const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');
// const sendEmail = async options =>{

//     //!1). create transport

//     const transporter =  nodemailer.createTransport({
//         host: process.env.EMAIL_HOST,
//         port: process.env.EMAIL_PORT,
//         auth:{
//             user: process.env.EMAIL_USERNAME,
//             pass: process.env.EMAIL_PASSWORD
//         }
//     })

//     //!2). Define the email option

//     const mailOptions = {
//         from: 'Shamshad Hussain <shamshad@natours.com>',
//         to: options.email ,
//         subject: options.subject,
//         text: options.message,
//         html:'<h3>This email send by natours</h3>'
//     }

//     //!3). Actually send the email
//     await transporter.sendMail(mailOptions);
// }

// module.exports = sendEmail



module.exports = class Email {
    constructor(user, url){
        this.to = user.email;
        this.firstName = user.name.split(' ')[0];
        this.url =  url;
        this.from = `shamshad hussain <${process.env.EMAIL_FROM}>`
    }

    newTransport(){
        //for production
        if(process.env.NODE_ENV === 'production'){
            //sendgrid setup later
            return nodemailer.createTransport({
                //Sendgrid
                // server: 'smtp.sendgrid.net',
                // ports: '465',
                // username: process.env.SENDGRID_USERNAME,
                // password: process.env.SENDGRID_PASSWORD

                
         host: "smtp.hostinger.com",
         port: 465,
         secure: true,
        auth: {
          user: "put your email",
          pass: "put your password",
        },

            })
        
        }

        //for development
       return  nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth:{
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    }

    //send the actual email
  async send(template, subject){
        //1) Render HTML based on a pug template
     const html =  pug.renderFile(`${__dirname}/../views/email/${template}.pug`,{
        firstName: this.firstName,
        url: this.url,
        subject: subject
     });

        //2). Define the email option
    const mailOptions = {
        from: this.from,
        to: this.to ,
        subject: subject,
        html: html,
        text: htmlToText.convert(html)//this is only work we need to install 'npm i html-to-text' package
    }

    //3) Create a transport and send a email
    const transporter =  this.newTransport();
    await transporter.sendMail(mailOptions);
    }

   async sendWelcome(){
        //!inside this 'this.send('welcome') this 'welcome' is pug template. and second is 'subject' we can write anything inside the subject but pug template name have to be same 'this send()' function only accept and works for sending mail when inside 'views' folder then 'email' folde 'welcome.pug' is same as inside the send() 'like this:-'this.send('welcome', 'Welcome to the Natours App')
     await this.send('welcome', 'Welcome to the Natours App')
    }

    async sendResetPassword(){
        //! this 'passwordReset' is a pug template. this is name same as in 'views/email/passwordReset.pug'  
        await this.send('passwordReset', 'Your token valid for 10 mint only')
    }
}
