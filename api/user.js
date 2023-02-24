const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();

const User = require("../schemas/userSchema");
const verifyToken = require("../Utilities/VerifyToken");
const e = require('express');

/**
    role: String <enum  ["student", "admin", "superadmin"]>
    firstName: String,
    lastName: String,
    middleName: String (Optional)
    gender: boolean,
    password: String,
    email: String
    age: Number,
    log: [{
            user: id,
            detail: String,
    }]
 */
app.post("/register", async (req,res, next) => {
    const params = req.body;
    const ifTakenEmail = await User.findOne({email: params.email});
    const ifTakenUsername = await User.findOne({firstName: params.firstName, lastName: params.lastName, middleName: params.middleName});
    if(ifTakenEmail || ifTakenUsername){
        res.status(401).send({message:"User already Exist"})
    }
    else{          
        const hashedPassword = await bcrypt.hash(params.password, 10);
        const dbUser = new User({
            firstName: params.firstName,
            lastName: params.lastName,
            middleName: params.middleName !== undefined ? params.middleName : "",
            email: params.email,
            password: hashedPassword,
            gender: params.gender,
            role: params.role,
            age: params.age,
            status: "pending"
        })    
        dbUser.save( async (err, room) => {
            if(err) {
                res.status(401).send({message:"Error", error:err.message});
            }
            room.log.push({
                    user: mongoose.Types.ObjectId(room.id),
                    detail: "Created by "+room.firstName+ ", "+room.lastName
            })
            room.save( async (err, data) => {
                if(err) {
                    res.status(401).send({message:"Error", error:err.message});
                }else{
                    
                data.password = undefined;
                res.status(201).send({message:"Success", data:data});
                }
            }) 
        })
    }
})
app.post("/login", async (req,res, next) => {
    const userLoggingIn = req.body;
    User.findOne({email: userLoggingIn.email})
        .then(dbUser => {
            if(!dbUser) {
                 res.status(404).send({message:"Incorrect Email or Password"}) 
            }else {
            bcrypt.compare(userLoggingIn.password, dbUser.password)
            .then(isMatch => {
                console.log(isMatch)
                if(isMatch){
                    if(dbUser.status === "approved"){                                          
                        const payload = {
                            id: dbUser._id,
                            firstName: dbUser.firstName,
                            lastName: dbUser.lastName,
                            role: dbUser.role,  
                        }
                        jwt.sign(
                            payload,
                            process.env.JWT_SECRET,
                            {expiresIn: 86400},
                            (err, token) => {
                                if(err)  {
                                    res.send({message: err})
                                }else{
                                    res.status(201).send({
                                        message:"Success",
                                        token: "Bearer "+token
                                    });
                                }
                            }
                        )
                    }else{
                         res.status(401).send({message:"User not Aprroved"})
                    }
                }else{
                    res.status(400).send({message:"Invalid Email or Password"})
                }
            })
            .catch(err => {
                 res.status(400).send({message:"Invalid Email or Password", error:err})
            })
        }
    })
})
app.get("/user", verifyToken, async (req,res, next) => {
    const userToGet = req.query;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
        User.find(userToGet)
            .populate({
                path: 'log.user',
                select: 'firstname lastName'
            })
            .exec(async (err, data) => {
                if(err) {
                    res.status(400).send({message: "Error", error: err.message})
                }
                else{
                    data.forEach(element => {
                        element.password = undefined;   
                    });
                    res.status(200).send({message: "Success", data: data})
                }
            })
    }
    else{
        await User.where(userToGet).select(["firstName","lastName"])
        .then(data => {
            res.status(201).send({message: "Success", data: data})
        })
           
    }
})
app.put("/user", verifyToken, async (req,res, next) => {
    const userToBeUpdate = req.body;
    //para ine makita kun nanu an guinBago
    const doChangeEmail = userToBeUpdate.email === undefined ? "": "Update Email, ";
    const doChageGender = userToBeUpdate.gender === undefined ? "": "Update Gender, ";
    const doChageAge = userToBeUpdate.age === undefined ? "": "Update Age, ";
    const doChangeRole = userToBeUpdate.role === undefined ? "": "Update Role, ";
    const doChangeFirstName = userToBeUpdate.firstName === undefined ? "": "Update First Name, ";
    const doChangeLastName = userToBeUpdate.lastName === undefined ? "": "Update Last Name, ";
    const doChangeMiddleName = userToBeUpdate.middleName === undefined ? "": "Update Middle Name, ";
    const doChangePassword = userToBeUpdate.password === undefined ? "": "Update Password, ";
    const doChangeStatus = userToBeUpdate.status === undefined ? "": "Update Status, ";
    //Kun an nagUUpdate ngane iba na tawo dapat undefined ine, otherwise an iya la sarili an pwede maUpdate
    if(userToBeUpdate._id !== undefined){
        let user = await User.findById(mongoose.Types.ObjectId(userToBeUpdate._id))
        let havePermission = false;
        if(!user){
             res.status(400).send({message: "User not Found"});
        }else if(user.role === "student" && (req.user.role === "admin" || req.user.role === "superadmin")){
            havePermission = true;
        }else if(user.role === "admin" && req.user.role === "superadmin"){
            havePermission = true;
        }
        if(havePermission){
            user.firstName = userToBeUpdate.firstName ? userToBeUpdate.firstName: user.firstName
            user.lastName = userToBeUpdate.lastName ? userToBeUpdate.lastName: user.lastName
            user.middleName = userToBeUpdate.middleName ? userToBeUpdate.middleName: user.middleName
            user.gender = userToBeUpdate.gender ? userToBeUpdate.gender: user.gender
            user.age = userToBeUpdate.age ? userToBeUpdate.age: user.age
            user.email = userToBeUpdate.email ? userToBeUpdate.email: user.email
            user.role = userToBeUpdate.role ? userToBeUpdate.role: user.role
            user.status = userToBeUpdate.status ? userToBeUpdate.status: user.status
            
            if(!(doChangePassword === "")){
                const hashedPassword = await bcrypt.hash(userToBeUpdate.password, 10);
                user.password = hashedPassword
            }
            user.log.push({
                user: mongoose.Types.ObjectId(req.user.id),
                detail:doChangePassword + doChangeEmail + doChangeStatus + doChageAge + doChangeRole + doChangeFirstName + doChangeLastName + doChangeMiddleName + doChangeRole + doChageGender
            })
            await user.save(async (err, data) => { 
                if(err) {
                     res.status(400).send({message:"Error", error:err.message})
                }
                else{
                    data.password = undefined;
                    res.status(200).send({message:"Success", data: data})
                }
            })
        }
        else{
            res.status(400).send({message: "Access Denied"});
        }
    }else{
        const user = await User.findById(req.user.id);
        user.firstName = userToBeUpdate.firstName ? userToBeUpdate.firstName: user.firstName
        user.lastName = userToBeUpdate.lastName ? userToBeUpdate.lastName: user.lastName
        user.middleName = userToBeUpdate.middleName ? userToBeUpdate.middleName: user.middleName
        user.gender = userToBeUpdate.gender ? userToBeUpdate.gender: user.gender
        user.age = userToBeUpdate.age ? userToBeUpdate.age: user.age
        user.email = userToBeUpdate.email ? userToBeUpdate.email: user.email
        user.role = userToBeUpdate.role ? userToBeUpdate.role: user.role
        if(doChangePassword){
            const hashedPassword = await bcrypt.hash(user.password, 10);
            user.password = hashedPassword
        }
        user.log.push({
            user: mongoose.Types.ObjectId(req.user.id),
            detail: doChangeEmail + doChangeRole + doChageAge + doChangeFirstName + doChangeLastName + doChageGender
        })
        await user.save(async (err, data) => { 
            if(err) {
                 res.status(400).send({message:"Error", error:err.message})
            }
            else{
                data.password = undefined;
                res.status(200).send({message:"Success", data: data})
            }
        })
    }
})
app.delete("/user", verifyToken, async (req,res,next)=>{
    const params = req.body;
    let user = await User.findById(mongoose.Types.ObjectId(params._id))
    let havePermission = false;
    if(!user){
         res.status(400).send({message: "User not Found"});
    }else if(user.role === "student" && (req.user.role === "admin" || req.user.role === "superadmin")){
        havePermission = true;
    }else if(user.role === "admin" && req.user.role === "superadmin"){
        havePermission = true;
    }
    if(havePermission){
        const result = await User.deleteOne({_id: mongoose.Types.ObjectId(params._id)})
        if(result.deletedCount === 1){
            res.status(200).send({message:"Success", user:result.deletedCount});
        }else{
            res.status(400).send({message:"Something Went Wrong"});
        }
    }else{
        res.status(401).json({message:"Access Denied"})
    }
})
module.exports = app