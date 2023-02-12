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

//Schemas
const Student = require("./schemas/userSchema");
const Admin = require("./schemas/adminSchema");
const Collection = require("./schemas/collectionSchema");
const Exam = require("./schemas/examSchema");
const Record = require("./schemas/recordSchema");

//functions
const verifyToken = async (req,res, next) => {
    const token = req.headers['x-access-token']?.split(' ')[1];
    //Decoded data = id, username, type
    // console.log(token);
    req.user = {};
    if(token){
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if(err) return res.json({
                isLoggingIn: false,
                message: "Failed to Authenticate",
                err: err
            })
            req.user.type = decoded.type;
            req.user.id = decoded.id;
            req.user.username = decoded.username;
            next(); 
        })
    }else{
        res.json({message:"Access Denied"})
    }
}



//API
//Students
app.post("/student/register", async (req,res) => {
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
app.post("/student/login", async (req,res) => {
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
                        username: dbUser.username,
                        type: "student"            
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
app.get("/student", verifyToken, async (req,res) => {
    if(req.user.type === "student"){
       await Student.findById({_id: req.user.id})
            .then(dbUser => {
                const user = {
                    id : dbUser.id,
                    username : dbUser.username,
                    gender : dbUser.gender,
                    email : dbUser.email,
                    status : dbUser.status
                }
                res.json({isLoggingIn: true, data: user})
            })
            .catch(err => {
                res.json({message: "Failed", err:err})
            })

    }else if(req.user.type === "admin"){
        await Student.find({})
            .then(data => {
                res.json({isLoggingIn: true, data: data})
            })
            .catch(err => {
                res.json({message: "Failed", err:err})
            })
    }
})
/**
    Required Data
    Student => oldPassword / newPassword
    Admin => studentId / newPassword
 */
app.post("/student/update/password", verifyToken, async (req,res) => {
    if(req.user.type === "student"){
       await Student.findById({_id: req.user.id})
            .then( async dbUser => {
                await bcrypt.compare(req.body.oldPassword, dbUser.password)
                .then( async isMatch => {
                    if(isMatch){
                        const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
                        await Student.findByIdAndUpdate({_id: req.user.id},{password:hashedPassword})
                                .then(
                                    res.json({message: "Success"})
                                )
                                .catch(err => {
                                    res.json({message:"Failed", err: err});
                                })
                    }else{
                        res.json({message:"Incorrect Credintials"});   
                    }
                })
                .catch(err => {
                    res.json({message: "Failed", err: err})
                });
            })
            .catch(err => {
                res.json({message: "Failed", err:err})
            })

    }else if(req.user.type === "admin"){
        //old password, and new password, id
        const hashedPassword = await bcrypt.hash(req.data.newPassword, 10);
        await Student.findByIdAndUpdate({_id: req.studentId},{password:hashedPassword})
                .then(
                    res.json({message: "Success"})
                )
                .catch(err => {
                    res.json({message:"Failed", err: err});
                })
    }
})
/**
 * 
    Required Data
    Student => gender / email
    Admin => studentId / gender, email, status
 */
app.post("/student/update", verifyToken, async (req,res) => {
    if(req.user.type === "student"){
        const data = {
            gender: req.body.gender,
            email: req.body.email
        }
        await Student.findByIdAndUpdate({_id: req.user.id},{data})
        .then(
            res.json({message: "Success"})
        )
        .catch(err => {
            res.json({message:"Failed", err: err});
        })
    }else if(req.user.type === "admin"){
        const data = {
            gender: req.body.gender,
            email: req.body.email,
            status: req.body.status
        }
        await Student.findByIdAndUpdate({_id: req.body.studentId},{data})
        .then(
            res.json({message: "Success"})
        )
        .catch(err => {
            res.json({message:"Failed", err: err});
        })
    }
})
/**
    Required Data
    Student => password / email
    Admin => studentId
 */
app.delete("student", verifyToken, async (req,res) => {
    if(req.user.type === "student"){
        await Student.findOne({_id:req.user.id, email: req.body.email})
            .then( async dbUser => {
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                await bcrypt.compare(hashedPassword, dbUser.password)
                    .then(async isMatch => {
                        if(isMatch){
                            await Student.deleteOne({_id:req.user.id})
                            .then(
                                res.json({message: "Success"})
                            )
                            .catch(err => {
                                res.json({message: "Failed", err:err})
                            })
                        }else{
                            res.json({message: "Incorrect Email"})
                        }
                    })
                    .catch()
            })
            .catch()

    }
    else if(req.user.type === "admin"){
        await Student.deleteById(req.studentId)
        res.json({message: "Success"});
    }
})



//Collections
app.get("/collection", async (req,res) => {
    await Collection.find({})
    .then(data => {
        res.json({message: "Success", data: data})
    })
})
/***
 * For Admin access only
 * Required Data
 * name
 */
app.post("/collection", verifyToken, async (req,res) => {
    console.log(req.body)
    if(req.user.type === "admin"){
        const newCollection = new Collection({
            name: req.body.name
        })
        await newCollection.save();
        res.json({message:"Success"})
    }else{
        res.json({message:"Access Denied"})
    }
})
/***
 * For Admin access only
 * Required Data
 * collectionId
 */
app.delete("/collection", verifyToken, async (req,res) => {
    if(req.user.type === "admin"){
       await Collection.deleteOne({_id:req.body.collectionId});
       res.json({message:"Success"})
    }else{
        res.json({message: "Operation Denied"})
    }
})






//Admin
app.post("/admin/register", verifyToken,async (req,res) => {
    //username, password, gender, email required
    if(req.user.type === "admin"){
        const user = req.body;
        const ifTakenEmail = await Admin.findOne({email: user.email});
        const ifTakenUsername = await Admin.findOne({username: user.username});

        if(ifTakenEmail || ifTakenUsername){
            res.json({message:"Username or Email has been taken"});
        }else{
            const hashedPassword = await bcrypt.hash(user.password, 10);
            const dbUser = new Admin({
                username: user.username,
                email: user.email,
                password: hashedPassword,
                gender: user.gender
            })
            dbUser.save();
            res.json({message:"Success"});
        }
    }else{
        res.json({message:"Operation Denied"});
    }
})
app.post("/admin/login", async (req,res) => {
    const userLoggingIn = req.body;
    Admin.findOne({email: userLoggingIn.email})
        .then(dbUser => {
            if(!dbUser) {
                return res.json({message:"Invalid Email or Password"})
            }
            bcrypt.compare(userLoggingIn.password, dbUser.password)
            .then(isMatch => {
                if(isMatch){
                    const payload = {
                        id: dbUser._id,
                        username: dbUser.username,
                        type: "admin"            
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
app.get("/admin", verifyToken, async (req,res) => {
    if(req.user.type === "admin"){
       await Admin.findById({_id: req.user.id})
            .then(dbUser => {
                const user = {
                    id : dbUser.id,
                    username : dbUser.username,
                    gender : dbUser.gender,
                    email : dbUser.email,
                    status : dbUser.status
                }
                res.json({isLoggingIn: true, data: user})
            })
            .catch(err => {
                res.json({message: "Failed", err:err})
            })

    }else {
        res.json({message: "Access Denied"})
    }
})

//Exams


//Records





//Database
mongoose.set("strictQuery", false);
mongoose.connect(dbURI, () => {
  console.log("Connected to MongoDB");
});
app.listen(port, () => 
    console.log("🔥Server is running on http:localhost:"+port)
);
