if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}


const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

//importing user model
const User = require('./models/user');

//connecting to database using url(DATABASE_URL) written in dotenv file
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true
});
const db = mongoose.connection
//if database has error in connection then showing error in console
db.on('error',error => console.error(error))
//once database connected then showing log in console
db.once('open',() => console.log('Connected to Mongoose'))


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

//request for data on home page
app.get('/',(req,res)=>{
    res.json({"hollo ~":"Hi ~~"})
});

//request for signUp or registeration
app.post('/api/users/register',(req,res)=>{
    //new userSchema for data given during signUp
    const user = new User(req.body);

    /-- before saving data we have to encrypt password that is done in user.js --/

    //saving data to database with password encrypted
    user.save((err,doc)=>{
        //saving data got error(like error return in password encryption) then showing error
        if(err) return res.json({success:false,err})
        //successful signUp and showing signUp data with status code 200
        res.status(200).json({
            success:true,
            userData: doc
        });
    });  
})

//request for signIn or login
app.post('/api/user/login',(req,res)=>{
    //finding the email in database
    User.findOne({email:req.body.email},(err,user)=>{
        //if not able to find email then showing message
        if(!user)
        return res.json({
            loginSuccess:false,
            message:"Auth failed, email not found"
        });

        //if email got then comparing password, before this we make comparePassword method in user.js
        user.comparePassword(req.body.password,(err,isMatch)=>{
            //password is not matched then showing massage
            if(!isMatch){
                return res.json({loginSuccess:false, message:"wrong password"})
            }
        })

        //JWT used to share security info between two parties-a client and a server
        //generating Token to ensure that claim cannot be altered, before this we make generateToken method in user.js
        // [user.generateToken] method then send the token as response to browser using cookie-parser.
        user.generateToken((err, user)=>{
            //error in generating token sending error
            if(err) return res.status(400).send(err);
            res.cookie("x_auth", user.token)
                .status(400)
                .json({
                    loginSuccess:true
                })
        })
    })
})

//connecting to port written in dotenv file otherwise to 3000
app.listen(process.env.PORT || 3000)
