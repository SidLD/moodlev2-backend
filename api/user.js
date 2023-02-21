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
        return res.status(401).send({message:"User already Exist"})
    }
            const hashedPassword = await bcrypt.hash(user.password, 10);
            const dbUser = new User({
                username: user.username,
                email: user.email,
                password: hashedPassword,
                gender: user.gender,
                role: user.role,
                status: "pending"
            })    
            dbUser.save().then(
                data => {
                    data.password = undefined;
                    return res.status(201).send({message:"Success", data:data});
            })
            .catch(err => {
                return res.status(401).send({message:"Error", error:err});
            })
            
    
     
})
app.post("/login", async (req,res, next) => {
    const userLoggingIn = req.body;
    User.findOne({email: userLoggingIn.email})
        .then(dbUser => {
            if(!dbUser) {
                return res.status(404).send({message:"Incorrect Email or Password"}) 
            }
            bcrypt.compare(userLoggingIn.password, dbUser.password)
            .then(isMatch => {
                console.log(isMatch)
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
                                if(err) return res.send({message: err});
                                return res.status(201).send({
                                    message:"Success",
                                    token: "Bearer "+token
                                });
                            }
                        )
                    }else{
                        return res.status(401).send({message:"User not Aprroved"})
                    }
                }else{
                    res.status(400).send({message:"Invalid Email or Password"})
                }
            })
            .catch(err => {
                return res.status(400).send({message:"Invalid Email or Password", error:err})
            })
        })
})
app.get("/user", verifyToken, async (req,res, next) => {
    const userToGet = req.body;
    if(req.user.role === "admin"){
        await User.where(userToGet).select(["username", "role", "status", "age", "gender", "email"])
        .then(data => {
            return res.status(201).send({isLoggingIn: true, data: data})
        })
        .catch(err => {
           return res.status(401).send({message: "Something Went Wrong", err:err})
        })
    }
    else{
        await User.where(userToGet).select(["username", "gender"])
        .then(data => {
            res.status(201).send({isLoggingIn: true, data: data})
        })
        .catch(err => {
            res.status(404).send({message: "User does not exist", err:err})
        })
           
    }
})

/**
 * Kun magUpdate password kailangan san student igLogin iya password & email utro 
 * 
 */
app.put("/user", verifyToken, async (req,res, next) => {
    const userToBeUpdate = req.body;
    console.log(userToBeUpdate.userId === undefined)
    if(userToBeUpdate.userId !== undefined){
        if(req.user.role === "admin"){
            User.findOneAndUpdate({_id:userToBeUpdate.userId}, userToBeUpdate, function(err, doc) {
                if (err) return res.status(400).send({message: err});
                return res.status(201).send('Succesfully saved.');
            })
        }
        next();
    }else{
        const user = await User.findById(req.user.id);
        user.username = userToBeUpdate.username ? userToBeUpdate.username: user.username
        user.gender = userToBeUpdate.gender ? userToBeUpdate.gender: user.gender
        user.age = userToBeUpdate.age ? userToBeUpdate.age: user.age
        user.email = userToBeUpdate.email ? userToBeUpdate.email: user.email
        if(userToBeUpdate.password !== undefined){
            const hashedPassword = await bcrypt.hash(user.password, 10);
            user.password = hashedPassword
        }
        await user.save()
        .then(data => {
            data.password = undefined;
           return res.status(201).send({message: "Success", data:data})
        })
        .catch(err => {
            res.status(400).send({message: err})
        })
    }
})

app.delete("/user", verifyToken, async (req,res,next)=>{
    const userToBeDeletedId = req.body.userId;
    if(req.user.role === "admin"){
        const user = await User.deleteOne({_id: userToBeDeletedId})
        if(user.deletedCount === 1){
            res.status(201).json({message:"Success", user:user});
        }else{
            res.status(500).json({message:"Something Went Wrong"});
        }
    }else{
        res.status(401).json({message:"Access Denied"})
    }
})
module.exports = app