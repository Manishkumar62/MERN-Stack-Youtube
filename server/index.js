if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}

const express = require('express');
const app = express();
const cors = require('cors')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const User = require('./models/user');
const auth = require('./middleware/auth');

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
const db = mongoose.connection
db.on('error',error => console.error(error))
db.once('open',() => console.log('Connected to Mongoose'))

app.use(cors())

app.use(bodyParser.urlencoded({ limit:'10mb', extended:false }))
app.use(bodyParser.json());
app.use(cookieParser());

//use this to show the image you have in node js server to client (react js)
//https://stackoverflow.com/questions/48914987/send-image-path-from-node-js-express-server-to-react-client
app.use('/uploads', express.static('uploads'));

app.get('/',(req,res)=>{
    res.json({"Hello":"I am Manish"})
})

//request for data on home page
app.get('/api/users/auth', auth, (req,res)=>{
    res.status(200).json({
        _id:req._id,
        isAuth:true,
        email:req.user.email,
        name:req.user.name,
        lastname:req.user.lastname,
        role:req.user.role,
        image: req.user.image,
    })
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
        return res.status(200).json({
            success:true,
            userData: doc
        });
    });  
})

//request for signIn or login
app.post('/api/users/login',(req,res)=>{
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
            res.cookie("x_authExp", user.tokenExp);
            res.cookie("x_auth", user.token)
                .status(200)
                .json({
                    loginSuccess:true, userId: user._id
                })
        })
    })
})

app.get('/api/users/logout',auth,(req,res)=>{
    User.findOneAndUpdate({_id:req.user._id}, {token:""},(err, doc)=>{
        if(err) return res.json({succes: false, err})
        return res.status(200).send({
            succes: true
        })
    })
})

app.listen(process.env.PORT || 5000);
