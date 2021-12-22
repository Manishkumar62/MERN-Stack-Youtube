if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}


const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const User = require('./models/user');


mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true
});
const db = mongoose.connection
db.on('error',error => console.error(error))
db.once('open',() => console.log('Connected to Mongoose'))


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());


app.get('/',(req,res)=>{
    res.json({"hollo ~":"Hi ~~"})
});

app.post('/api/users/register',(req,res)=>{
    const user = new User(req.body)
    user.save((err,userData)=>{
        if(err) return res.json({success:false,err})
        return res.status(200).json({
            success:true
        });
    });
    
})

app.listen(process.env.PORT || 3000)
