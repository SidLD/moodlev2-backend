const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const Question = require("../schemas/questionSchema");
const Exam = require("../schemas/examSchema");

/**
 * _id: id ine san question
 * exam: id,
    question: String,
    type: String <enum  ["MultipleChoice", "FillInTheBlank", "TrueOrFalse"]>
    answer: String
    choices: [String],
    log: [{
            user: id,
            detail: String,
            createdAt: Date
    }]
 */
const getQuestion = async (req, res) => {
    const params = req.query;
    Question.where(params)
        .populate({
            path: 'exam',
            select: '_id dateTimeStart dateTimeEnd duration itemNumber category',
            populate: {
                path: 'category',
                select: '_id name'
            }           
        })
        .populate({
            path: 'log.user',
            select: '_id firstName lastName'
        })
        .exec((err, data) => {
            if (err) {
                res.status(400).send({message: "Error", err: err.message})
            }else{
                if(req.user.role === "admin" || req.user.role === "superadmin"){
                    res.status(200).send({message: "Success", data: data})
                }else{
                    res.status(401).send({message: "Access Denied"})
                }
            }
        });
}
const createQuestion = async (req, res) => {
    const params = req.body;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
        try {
            const {exam, questions} = params;
            let questionsParam = [];
            questions.forEach(question => {
                questionsParam.push(
                    {
                        choices : question.choices,
                        type : question.type,
                        answer: question.answer,
                        question: question.question,
                        exam : mongoose.Types.ObjectId(exam),
                        log : {
                            user: mongoose.Types.ObjectId(req.user.id),
                            detail: "Created Question by "+req.user.firstName + " "+req.user.lastName
                        }
                        
                    }
                )
            });

            const data  = await Question.create(questionsParam)
                if(!data)  {
                    res.status(400).send({message:"Error", error:err.message})
                }
                else {
                    let examData = await Exam.findById(mongoose.Types.ObjectId(exam))
                    data.forEach(temp => {
                        examData.questions.push(mongoose.Types.ObjectId(temp._id));
                    })
                    await examData.save(async (err, room) => {
                        if(err)  {
                            res.status(400).send({message:"Error", error:err.message})
                        }{
                            res.status(200).send({message:"Success", data: data})
                        }
                    })
                }
        } catch (error) {
            return res.status(300).send({message: "Something Went Wrong", error:error.message})
        } 
    }else{
       return res.status(401).send({message: "Access Denied"})
    }
}
// Kailangan didi 
//question (an id san question)
//exam (an id san exam)
const deleteQuestion = async (req, res) => {
    const params = req.body;
    if(params._id === undefined ){
       res.status(400).send({message: "Question not Found"}) 
    }else{
        if(req.user.role === "admin" || req.user.role === "superadmin"){
            await Question.deleteOne({_id: params._id})
            .then(async () => {
               return await Exam.updateMany({questions: params._id}, {$pull: {questions: params._id}})                
            })
            .then(async (doc) => {
                if(doc.modifiedCount > 0){
                    let exam = await Exam.findById(mongoose.Types.ObjectId(params.exam));
                    exam.log({
                        user: mongoose.Types.ObjectId(req.user.id),
                        detail: "Deleted Question"
                    })
                    res.status(200).send({message: "Success", deletedCount: doc.modifiedCount})
                }else{
                    res.status(400).send({message: "Error", deletedCount: doc.modifiedCount})
                }
            })
            .catch(err => {
                res.status(400).send({message: "Error", error: err.message}) 
            })
        }
        else{
            res.status(401).send({message: "Access Denied"})
        }
    }
}

const updateQuestion = async (req, res) => {
    const params = req.body;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
        if(params._id === undefined){
            res.status(400).send({message: "Question _id is required"})
        }else{
            try {
                const doChangeExam = params.exam === undefined ? "" : "Modified Exam Id, ";
                const doChangeQuestion = params.question === undefined ? "" :"Modified Question, ";
                const doChangeAnswer = params.answer === undefined ? "" : "Modified Answer, ";
                const doChangeChoices = params.choices === undefined ? "" :"Modified Choices, ";
                const doChangetype = params.type === undefined ? "" : "Modified type, ";
        
                
                console.log(params._id)
                let question = await Question.findById(mongoose.Types.ObjectId(params._id));
        
                question.exam = doChangeExam === "" ? mongoose.Types.ObjectId(question.exam) : mongoose.Types.ObjectId(params.exam)
                question.question = doChangeQuestion === "" ? question.question : params.question;
                question.answer = doChangeAnswer === "" ? question.answer : params.answer;
                question.choices = doChangeChoices === "" ? question.choices : params.choices;
                question.type = doChangetype === "" ? question.type : params.type;

                question.log.push({
                    user: mongoose.Types.ObjectId(req.user.id),
                    detail: doChangeAnswer + doChangeChoices + doChangeExam + doChangeQuestion + doChangetype
                })
                await question.save(async (err, data) => { 
                    if(err) {
                         res.status(400).send({message:"Error", error:err.message})
                    }
                    else{
                        res.status(200).send({message:"Success", data: data})
                    }
                })
            } catch (error) {
                res.status(400).send({message: "Error", error: error.message})
            }
        }
    }
    else{
        res.status(401).send({message: "Access Denied"})
    }
}
exports.createQuestion = createQuestion;
exports.getQuestion = getQuestion;
exports.updateQuestion  = updateQuestion;
exports.deleteQuestion = deleteQuestion;
