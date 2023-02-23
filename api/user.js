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
    const params = req.body;
    const ifTakenEmail = await User.findOne({email: params.email});
    const ifTakenUsername = await User.findOne({username: params.username});

    if(ifTakenEmail || ifTakenUsername){
        return res.status(401).send({message:"User already Exist"})
    }
    const hashedPassword = await bcrypt.hash(params.password, 10);
    const dbUser = new User({
        username: params.username,
        email: params.email,
        password: hashedPassword,
        gender: params.gender,
        role: params.role,
        status: "pending"
        })    
    dbUser.save( async (err, room) => {
        if(err) {
            return res.status(401).send({message:"Error", error:err});
        }
        room.log.push({
                _id: mongoose.Types.ObjectId(room.id),
                detail: "Created by"+room.username
        })
        room.save( async (err, data) => {
            if(err) {
                return res.status(401).send({message:"Error", error:err});
            }
            data.password = undefined;
                return res.status(201).send({message:"Success", data:data});
            }) 
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
    const userToGet = req.query;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
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

app.put("/user", verifyToken, async (req,res, next) => {
    const userToBeUpdate = req.body;
    //para ine makita kun nanu an guinBago
    const doChangeEmail = userToBeUpdate.email === undefined ? "": "Update Email, ";
    const doChageGender = userToBeUpdate.gender === undefined ? "": "Update Gender, ";
    const doChangeRole = userToBeUpdate.role === undefined ? "": "Update Role, ";
    const doChangeUsername = userToBeUpdate.username === undefined ? "": "Update Username";
    //Kun an nagUUpdate ngane iba na tawo dapat undefined ine, otherwise an iya la sarili an pwede maUpdate
    if(userToBeUpdate.userId !== undefined){
        let user = User.findById(mongoose.Types.ObjectId(userToBeUpdate.userId))
        let havePermission = false;
        if(!user){
            return res.status(400).send({message: "User not Found"});
        }else if(user.role === "student" && (req.user.role === "admin" || req.user.role === "superadmin")){
            havePermission = true;
        }else if(user.role === "admin" && req.user.role === "superadmin"){
            havePermission = true;
        }
        if(havePermission){
            user.username = userToBeUpdate.username ? userToBeUpdate.username: user.username
            user.gender = userToBeUpdate.gender ? userToBeUpdate.gender: user.gender
            user.age = userToBeUpdate.age ? userToBeUpdate.age: user.age
            user.email = userToBeUpdate.email ? userToBeUpdate.email: user.email
            if(userToBeUpdate.password !== undefined){
                const hashedPassword = await bcrypt.hash(user.password, 10);
                user.password = hashedPassword
            }
            user.log.push({
                _id: mongoose.Types.ObjectId(req.user.id),
                detail: doChangeEmail + doChangeRole + doChangeUsername + doChageGender
            })
            await user.save(async (err, data) => { 
                if(err) {
                    return res.status(400).send({message:"Error", error:err})
                }
                data.password = undefined;
                return res.status(200).send({message:"Success", data: data})
            })
        }
        return res.status(400).send({message: "Access Denied"});
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
        user.log.push({
            _id: mongoose.Types.ObjectId(req.user.id),
            detail: doChangeEmail + doChangeRole + doChangeUsername + doChageGender
        })
        await user.save(async (err, data) => { 
            if(err) {
                return res.status(400).send({message:"Error", error:err})
            }
            data.password = undefined;
            return res.status(200).send({message:"Success", data: data})
        })
    }
})

app.delete("/user", verifyToken, async (req,res,next)=>{
    const userToBeDeletedId = req.body.userId;
    let user = User.findById(mongoose.Types.ObjectId(userToBeUpdate.userId))
    let havePermission = false;
    if(!user){
        return res.status(400).send({message: "User not Found"});
    }else if(user.role === "student" && (req.user.role === "admin" || req.user.role === "superadmin")){
        havePermission = true;
    }else if(user.role === "admin" && req.user.role === "superadmin"){
        havePermission = true;
    }
    if(havePermission){
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