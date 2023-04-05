const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const verifyToken = require("../Utilities/VerifyToken")
const Exam = require("../schemas/examSchema");
const User = require("../schemas/userSchema");
const Record = require("../schemas/recordSchema");

//magamit didi _id para sa record._id
const getRecord =  async (req, res) => {
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
}

//Pag add la ine san question/answers
const updateRecord = async (req, res) => {
    const params = req.body;
    let record = await Record.findOne({
        exam:mongoose.Types.ObjectId(params.exam), 
        student:mongoose.Types.ObjectId(req.user.id)
    })
    if(record){
        let ifExist = false;
        //Assuming that update data is an array of question = {question(an id), answer}
        params.question.forEach(data => {
            record.answers.forEach(recordAnswer => {
                if(recordAnswer.question === data.question){
                    recordAnswer.answer=data.answer
                    ifExist = true
                }
            })
        })
        if(!ifExist){
            record.answers.push({
                question: mongoose.Types.ObjectId(params.question),
                answer: params.answer
            })
        }
        await record.save()
        res.status(201).send({message: "Success", record: record})
    }else{
        res.status(400).send({message: "Record Not Found"})
    }
}


const deleteRecord =  async (req, res) => {
    const params = req.body;
    let record = await Record.findOne({
        exam:mongoose.Types.ObjectId(params.exam), 
        student:mongoose.Types.ObjectId(req.user.id)
    })
    if(record){
        await record.deleteOne({_id: mongoose.Types.ObjectId(record._id)});
        res.status(201).send({message: "Success", record: record})
    }else{
        res.status(400).send({message: "Record Not Found"})
    }  
}
exports.getRecord = getRecord;
exports.deleteRecord = deleteRecord;
exports.updateRecord = updateRecord;