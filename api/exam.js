const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const verifyToken = require("../Utilities/VerifyToken")
const Exam = require("../schemas/examSchema");
const Record = require("../schemas/recordSchema");
const Question = require("../schemas/questionSchema");
const e = require('express');

/**
 *     ****** Structure *****
    exam: id / _id
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
                }else{
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
            Exam.where(params)
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
            let record = await Record.findOne({
                exam:mongoose.Types.ObjectId(params.exam), 
                student:mongoose.Types.ObjectId(req.user.id),
                isComplete: false
            })
            let exam = await Exam.findOne({_id:mongoose.Types.ObjectId(params.exam)})
                .populate({
                    path: 'category',
                    select: '_id name'
                })
                .select(['dateTimeStart', 'dateTimeEnd', 'duration', 'itemNumber', 'category']);
            let isContinue = false;
            if(record){
                isContinue = record.isContinue;
            }
            if(exam !== null){
                const today = new Date();
                const examStartDate = new Date(exam.dateTimeStart);
                const examEndDate = new Date(exam.dateTimeEnd)
                if( examStartDate < today && examEndDate > today){
                    if(record){
                        if((today - examEndDate) < duration){
                            res.status(401).send({message: "Exam is Closed", isContinue: false, exam: exam});
                        }else{
                            res.status(200).send({message: " Success", isContinue: isContinue, exam: exam});
                        }
                    }else{
                        res.status(200).send({message: " Success", isContinue: isContinue, exam: exam});
                    }
                }else{
                    res.status(401).send({message: "Exam is Closed", isContinue: isContinue, exam: exam});
                }
            }else{
                res.status(404).send({message: "Exam not Found"})
            }
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
            await Exam.findOne({_id:mongoose.Types.ObjectId(params.exam)})
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
        await Exam.deleteOne({_id: params.exam})
            .then(async () => {
               return await Question.deleteMany({exam: params.exam})                
            })
            .then(async (doc) => {
                if(doc.modifiedCount > 0){
                    res.status(200).send({message: "Success", deletedCount: doc.modifiedCount})
                }else{
                    res.status(400).send({message: "Error", deletedCount: doc.modifiedCount})
                }
            })
            .catch(err => {
                res.status(400).send({message: "Error", error: err.message}) 
            })
    }else {
        res.status(401).send({message:"Access Denied"})
    }
})
app.post("/exam/attempt", verifyToken, async (req, res) => {
    const params = req.body;
    Exam.findOne({_id: params.exam})
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
                //Kun mayda record an user pati exam, dapat igContinue la iton

                let isContinue = true;
                const today =  new Date();
                
                if(new Date(data.dateTimeStart) < today ){
                    data.questions = undefined;
                    res.status(401).send({message:"Exam is not open yet."})
                }else if(new Date(data.dateTimeEnd) > today){
                    data.questions = undefined;
                    res.status(401).send({message:"Exam is closed."})
                }else{
                        let record = await Record.findOne({ 
                            exam:mongoose.Types.ObjectId(params.exam), 
                            student:mongoose.Types.ObjectId(req.user.id)
                        })
                        if(record === null){
                            record = new Record({
                                exam:mongoose.Types.ObjectId(params.exam), 
                                student:mongoose.Types.ObjectId(req.user.id),
                                timeStart: today
                            })
                            isContinue = false;
                            await record.save();
                        }
                        res.status(200).send({message: "Success", exam: data, record: record, isContinue: isContinue})
                }
                   
            }
        }
    )
})
app.post("/exam/submit", verifyToken, async (req, res) => {
    const params = req.body;
    Record.findById(mongoose.Types.ObjectId(params.record))
        .populate({
            path: "exam",
            populate: {
                path: 'questions'
            }
        })
        .populate('student')
        .populate('answers.question')
        .exec(async (err, data) => {
            if(err){
                res.status(400).send({message: "Error", error: err.message});
            }else{
                const questions = data.exam.questions;
                const answers = data.answers;
                let score = 0;
                answers.forEach(answer => {
                    questions.forEach(question => {
                        if(answer.question._id.equals(question._id)){
                            if(answer.answer === question.answer){
                                answer.isCorrect === true
                                score++;
                            }else{
                                answer.isCorrect === false
                            }
                        }
                    })
                });
                data.score = score;
                data.answers = answers;
                data.isComplete = true;
                data.timeEnd = Date.now();
                await data.save();
                data.exam.questions = undefined;
                data.exam.log = undefined;
                data.student.log = undefined;
                data.student.password = undefined;
                data.student.email = undefined;
                data.student.createdAt = undefined;
                data.student.updatedAt = undefined;
                res.status(200).send({message: "Success", data: data})
            }
        })
})
module.exports = app