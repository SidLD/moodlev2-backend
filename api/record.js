const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const verifyToken = require("../Utilities/VerifyToken")
const Exam = require("../schemas/examSchema");
const User = require("../schemas/userSchema");
const Record = require("../schemas/recordSchema");

//magamit didi _id para sa record._id
app.get("/record", verifyToken, async (req, res) => {
    const params = req.query;
    Record.where(params)
        .populate({
            path: 'exam',
            select: '_id dateTimeStart dateTimeEnd duration itemNumer category',
            populate: {
                path: 'category',
                select: 'name _id'
            }
        })
        .populate({
            path: 'student',
            select: '_id firstName lastName'
        })
        .populate({
            path: 'answers.question'
        })
        .exec( async (err, data) => {
            //array of data
            try {
                if(req.user.role === "admin" || req.user.role === "superadmin"){
                    res.status(200).send({message: "Success", data: data})
                }else{       
                    data.forEach(record => {
                        //an records na
                        let answers = record.answers;
                        answers.forEach(room => {
                            if(room.answer === room.question.answer){
                                answers.isCorrect == true;
                            }else{
                                answers.isCorrect == false;
                            }
                            room.question.answer = undefined;
                            room.question.choices = undefined;
                        })
                    });
                    res.status(200).send({message: "Success", data: data})
                }
            } catch (error) {
                res.status(400).send({message: "Error", error: error.message})   
            }
        } )
})

app.put("/record", verifyToken, async (req, res) => {
    const params = req.body;
    let record = await Record.findOne({
        exam:mongoose.Types.ObjectId(params.exam), 
        student:mongoose.Types.ObjectId(req.user.id)
    })
    if(record){
        record.answers.push({
            question: mongoose.Types.ObjectId(params.question),
            answer: params.answer
        })
        await record.save()
        res.status(201).send({message: "Success", record: record})
    }else{
        res.status(400).send({message: "Record Not Found"})
    }
})
// app.post('/record', verifyToken, async (req, res) => {
//     const params = req.body;
//     if(req.user.role === "admin" || req.user.role === "superadmin"){
//         try {
//             const today = new Date();
//             res.status(200).send({message: "Success", data: today});
//         } catch (error) {
//             return res.status(300).send({message: "Something Went Wrong", error:error.message})
//         } 
//     }else{
//        return res.status(401).send({message: "Access Denied"})
//     }
// })



module.exports = app