const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const verifyToken = require("../Utilities/VerifyToken")
const Exam = require("../schemas/examSchema");

/**
 *     ****** Structure *****
    
    dateTimeStart : Date
    dateTimeEnd : Date
    category : id
    duration : number
    itemNumber : number
    log: [{
            user: id,
            detail: String,
            createdAt: Date
    }]
 */
app.post("/exam", verifyToken, async (req, res) => {
    const params = req.body;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
        try {
            const {dateTimeStart, dateTimeEnd, category, duration, itemNumber} = params;
            if(dateTimeStart > dateTimeEnd){
                res.status(300).send({message: "Invalid Time"})
            }
            const newExam = new Exam({
                dateTimeStart : new Date(dateTimeStart),
                dateTimeEnd : new Date(dateTimeEnd),
                duration: duration,
                itemNumber: itemNumber,
                category : mongoose.Types.ObjectId(category)
            })
            newExam.log.push({
                user: mongoose.Types.ObjectId(req.user.id),
                detail: "Created Exam"
            })
            await newExam.save(async (err,data) => {
                if(err)  {
                    res.status(401).send({message:"Error", error:err.message})
                }{
                    res.status(200).send({message:"Success", data: data})
                }
            })
        } catch (error) {
            res.status(300).send({message: "Something Went Wrong", error:error.message})
        } 
    }else{
        res.status(401).send({message: "Access Denied"})
    }
})
app.get("/exam", verifyToken, async (req, res) => {
    const params = req.query;
    try {
        if(req.user.role === "admin" || req.user.role === "superadmin"){
            Exam.findOne(params)
                .populate({
                    path: 'log.user',
                    select: 'firstName lastName',
                })
                .populate({
                    path: 'category',
                    select: 'name _id',
                })
                .populate({
                    path: 'questions',
                    populate: {
                        path: 'log.user',
                        select: 'firstName lastName',
                    }
                })
                .exec( async (err, data) => {
                    if (err) {
                        res.status(400).send({message: "Error", err: err.message})
                    }else{
                        res.status(200).send({message: "Success", data: data})
                    }
                });
        }else{
            Exam.findOne({_id: params._id})
            .populate({
                path: 'questions',
                select: 'question choices type'
            })
            .populate({
                path: 'category',
                select: '_id name'
            })
            .select(['dateTimeStart', 'dateTimeEnd', 'duration', 'itemNumber', 'category'])
            .exec(async (err, data) => {
                if(err){
                    res.status(400).send({message: "Error", error: err.message})
                }
                else if(data === null){
                    res.status(404).send({message: "Exam not Found"})   
                }
                else{

                    //Mag attemp ngae siya igCheck anay an date
                    //Kun dre ngane dapat tangalon an questions
                    if(params.attempt === 'true'){
                        const today =  new Date();
                        if(new Date(data.dateTimeStart) < today && new Date(data.dateTimeEnd) > today){
                            res.status(200).send({message: "Success", data: data})
                        }else{
                            data.questions = undefined;
                            res.status(401).send({message: "Exam is Closed"})
                        }
                    }
                    else{
                        data.questions = undefined;
                        res.status(200).send({message: "Success", data: data})
                    }
                }
            })
        }
    }
    catch(error) {
        res.status(400).send({message: "Error", error: error.message})
    }
})
app.put("/exam", verifyToken, async (req, res) => {
    const params = req.body;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
        try {
            await Exam.findOne({_id:mongoose.Types.ObjectId(params._id)})
                .then(async (exam) => {

                    const doChangeDateTimeStart = params.dateTimeStart === undefined ? "": "Modified Date Start, "
                    const doChangeDateTimeEnd = params.dateTimeEnd === undefined ? "": "Modified End, ";
                    const doChangeCategory = params.category === undefined ? "": "Modified Category, "; 
                    const doChangeDuration = params.duration === undefined ? "" : "Modified Duration, ";
                    const doChangeItemNumber = params.itemNumber === undefined ? "": "Modified Item number, "; 
                    
                
                    exam.dateTimeStart = doChangeDateTimeStart === "" ? new Date(exam.dateTimeStart) : new Date(params.dateTimeStart);
                    exam.dateTimeEnd = doChangeDateTimeEnd === ""  ? new Date(exam.dateTimeEnd) :  new Date(params.dateTimeEnd);
                    exam.duration = doChangeDuration === "" ? exam.duration : params.duration;
                    exam.itemNumber = doChangeItemNumber === "" ? exam.itemNumber :  params.itemNumber;
                    exam.category = doChangeCategory === "" ? mongoose.Types.ObjectId(exam.category) :  mongoose.Types.ObjectId(params.category);
        
                    if(exam.dateTimeStart > exam.dateTimeEnd){
                        res.status(400).send({message: "Invalid Time"})
                    }
                    
                    exam.log.push({
                        user: mongoose.Types.ObjectId(req.user.id),
                        detail: doChangeDateTimeStart + doChangeDateTimeEnd + doChangeCategory + doChangeDuration + doChangeItemNumber
                    })
                    await exam.save(async (err,data) => {
                        if(err) { 
                            res.status(400).send({message:"Error", error:err.message})
                        }else{
                            res.status(200).send({message:"Success", data: data})
                        }
                    })
                })
        } catch (error) {
            return res.status(400).send({message: "Something Went Wrong", error:error.message})
        } 
    }else{
        res.status(401).send({message: "Access Denied"})
    }
})

app.delete("/exam", verifyToken, async (req, res) => {
    const params = req.body;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
        const exam = await Exam.deleteOne({_id: params._id})
        if(exam.deletedCount === 1){
            res.status(200).send({message:"Success", deletedCount: exam.deletedCount});
        }else{
            res.status(400).send({message:"Invalid Data"});
        }
    }else {
        res.status(401).send({message:"Access Denied"})
    }
})
module.exports = app