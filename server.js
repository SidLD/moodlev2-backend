const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors')
require('dotenv').config();

//setup
const app = express();
const port = process.env.PORT;
const dbURI = process.env.ATLAS_URI;
const urlencodedParser = bodyParser.urlencoded({extended:false})
app.use(bodyParser.json(), urlencodedParser);
app.use(cors());
app.use(express.json());


//Database
mongoose.set("strictQuery", false);
mongoose.connect(dbURI, () => {
  console.log("Connected to MongoDB");
});


//Schemas
const Student = require("./schemas/userSchema");

//functions
const verifyToken = async (req,res, next) => {
    const token = req.headers['x-access-token']?.split(' ')[1];
    console.log(token);
    if(token){
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if(err) return res.json({
                isLoggingIn: false,
                message: "Failed to Authenticate",
                err: err
            })
            req.user = {};
            req.user.id = decoded.id;
            req.user.username = decoded.username;
            next();  
        })
    }else{
        res.json({message:"Incorrect Token Given", isLoggingIn: false});
    }
}



//API
app.post("/register", async (req,res) => {
    //username, password, gender, email required
    const user = req.body;
    const ifTakenEmail = await Student.findOne({email: user.email});
    const ifTakenUsername = await Student.findOne({username: user.username});

    if(ifTakenEmail || ifTakenUsername){
        res.json({message:"Username or Email has been taken"});
    }else{
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const dbUser = new Student({
            username: user.username,
            email: user.email,
            password: hashedPassword,
            gender: user.gender
        })
        dbUser.save();
        res.json({message:"Success"});
    }
})

app.post("/login", async (req,res) => {
    const userLoggingIn = req.body;
    console.log(userLoggingIn);
    Student.findOne({email: userLoggingIn.email})
        .then(dbUser => {
            if(!dbUser) {
                return res.json({message:"Invalid Email or Password"})
            }
            bcrypt.compare(userLoggingIn.password, dbUser.password)
            .then(isMatch => {
                if(isMatch){
                    const payload = {
                        id: dbUser._id,
                        username: dbUser.username            
                    }
                    jwt.sign(
                        payload,
                        process.env.JWT_SECRET,
                        {expiresIn: 86400},
                        (err, token) => {
                            if(err) return res.json({message: err});
                            return res.json({
                                message:"Success",
                                token: "Bearer "+token
                            });
                        }
                    )
                }else{
                    return res.json({message:"Invalid Email or Password"})
                }
            })
        })
})

app.get("/getUsername", verifyToken, (req,res) => {
    res.json({isLoggingIn: true, username: req.body.username})
})






app.listen(port, () => 
    console.log("🔥Server is running on http:localhost:"+port)
);




