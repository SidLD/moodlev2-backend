const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();

const User = require("../schemas/userSchema");
const verifyToken = require("../Utilities/VerifyToken")

app.post("/exam", async (req,res, next) => {
    const params = req.body;
    if(req.user.role === "admin"){
        const {dateTimeStart, dateTimeEnd, collectionId, duration, itemNumber} = params;
        try {
            if(dateTimeStart > dateTimeEnd){
                return res.status(300).send({message: "Invalid Time"})
            }
            const newExam = new Exam({
                dateTimeStart : new Date(dateTimeStart),
                dateTimeEnd : new Date(dateTimeEnd),
                duration: duration,
                itemNumber: itemNumber,
                collection_id : mongoose.Types.ObjectId(collectionId)
            })
            await newExam.save(async (err,room) => {
                if(err) return res.status(400).send({message:"Invalid Data"});
                room.log.push({
                    _id: mongoose.Types.ObjectId(req.user.id),
                    detail: "Created Exam by"+req.user.username
                })
                await room.save(async (err, data) => { 
                    if(err) {
                        return res.status(400).send({message:"Error", error:err})
                    }
                    return res.status(200).send({message:"Success", data: data})
                })
             });
        } catch (error) {
            return res.status(300).send({message: "Invalid Time"})
        } 
    }else{
       return res.status(401).send({message: "Access Denied"})
    }
})
app.get("/exam", verifyToken, async (req,res, next) => {
    const userToGet = req.query;
})
app.put("/exam", verifyToken, async (req,res, next) => {
    const userToBeUpdate = req.body;
})
app.delete("/exam", verifyToken, async (req,res,next)=>{

})
module.exports = app