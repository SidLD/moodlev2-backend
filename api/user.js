const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();

const User = require("../schemas/userSchema");
const verifyToken = require("../Utilities/VerifyToken")

app.post("/register", async (req,res, next) => {
    //username, password, gender, email required
    const user = req.body;
    const ifTakenEmail = await User.findOne({email: user.email});
    const ifTakenUsername = await User.findOne({username: user.username});

    if(ifTakenEmail || ifTakenUsername){
        res.status(401).send({message:"User already Exist"})
    }else{
        const hashedPassword = await bcrypt.hash(user.password, 10);
            const dbUser = new User({
                username: user.username,
                email: user.email,
                password: hashedPassword,
                gender: user.gender,
                role: user.role,
                status: "pending"
            })    
            dbUser.save();
            res.status(201).json({message:"Success", id:dbUser._id});
        }
       
})
app.post("/login", async (req,res, next) => {

    const userLoggingIn = req.body;

    User.findOne({"email": userLoggingIn.email})
        .then(dbUser => {
            if(!dbUser) {
                res.status(401).send({message:"Invalid Email or Password"})
            }
            bcrypt.compare(userLoggingIn.password, dbUser.password)
            .then(isMatch => {
                if(isMatch){
                    if(dbUser.status === "approved"){                                          
                        const payload = {
                            id: dbUser._id,
                            username: dbUser.username,
                            role: dbUser.role,  
                        }
                        jwt.sign(
                            payload,
                            process.env.JWT_SECRET,
                            {expiresIn: 86400},
                            (err, token) => {
                                if(err) return res.json({message: err});
                                return res.status(201).json({
                                    message:"Success",
                                    token: "Bearer "+token
                                });
                            }
                        )
                    }else{
                        res.status(401).send({message:"User not Aprroved"})
                    }
                }else{
                    res.status(401).send({message:"Invalid Email or Password"})
                }
            })
        })
})
app.get("/user", verifyToken, async (req,res, next) => {
    const userToGet = req.body.user;
    if(req.user.role === "student"){
        //Kay what if karuyag san student kiton an iba na student? magReturn la dapat noh username
        if(userToGet.username === req.uer.username){
            await User.findById({_id: req.user.id})
            .then(dbUser => {
                const user = {
                    id : dbUser.id,
                    username : dbUser.username,
                    gender : dbUser.gender,
                    email : dbUser.email,
                    status : dbUser.status,
                    role: dbUser.role
                }
                res.status(201).json({isLoggingIn: true, data: user})
            })
            .catch(err => {
                res.status(401).send({message: "Something Went Wrong", err:err})
            })
        }
        else{
            await User.findById({_id: req.user.id})
            .then(dbUser => {
                const user = {
                    username : dbUser.username,
                    role: dbUser.role,
                    gender : dbUser.gender,
                }
                res.status(201).json({isLoggingIn: true, data: user})
            })
            .catch(err => {
                res.status(401).send({message: "Something Went Wrong", err:err})
            })
        }
    }
    else if(req.user.type === "admin"){
        await Student.find({email:1, username:1, _id:1, gender:1, status:1, role:1})
            .then(data => {
                res.status(201).json({isLoggingIn: true, data: data})
            })
            .catch(err => {
                res.status(401).json({message: "User does not exist", err:err})
            }
        )
    }
})

module.exports = app