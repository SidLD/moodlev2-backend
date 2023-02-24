const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const verifyToken = require("../Utilities/VerifyToken")
const Question = require("../schemas/questionSchema");
const Exam = require("../schemas/examSchema");

/**
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
app.post("/question", verifyToken, async (req, res) => {
    const params = req.body;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
        try {
            const {exam, question, answer, choices, type} = params;

            const newQuestion = new Question({
                choices : choices,
                type : type,
                answer: answer,
                question: question,
                exam : mongoose.Types.ObjectId(exam)
            })
            newQuestion.log.push({
                user: mongoose.Types.ObjectId(req.user.id),
                detail: "Created Question by "+req.user.username
            })
            await newQuestion.save(async (err,room) => {
                if(err)  {
                    res.status(400).send({message:"Error", error:err.message})
                }
                else {
                    let exam = await Exam.findById(mongoose.Types.ObjectId(room.exam))
                    exam.questions.push(mongoose.Types.ObjectId(room._id));
                    await exam.save(async (err, data) => {
                        if(err)  {
                            res.status(400).send({message:"Error", error:err.message})
                        }{
                            res.status(200).send({message:"Success", data: room})
                        }
                    })
                }
            })
        } catch (error) {
            return res.status(300).send({message: "Something Went Wrong", error:error.message})
        } 
    }else{
       return res.status(401).send({message: "Access Denied"})
    }
})


module.exports = app