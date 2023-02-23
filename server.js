const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cors = require('cors')
require('dotenv').config();

//setup
const app = express();
const port = process.env.PORT;
const dbURI = process.env.ATLAS_URI;
const urlencodedParser = bodyParser.urlencoded({extended:false})
app.use(bodyParser.json(), urlencodedParser);
app.use(cors());
app.use(express.json());

//Schemas
const User = require("./schemas/userSchema");
const Exam = require("./schemas/examSchema");
const Record = require("./schemas/recordSchema");
const Question = require("./schemas/questionSchema");

//Functions
const verifyToken = require("./Utilities/VerifyToken");

//API
const userAPI = require("./api/user");
const categoryAPI = require("./api/category");
const examAPI = require("./api/exam")

app.use(userAPI);
app.use(categoryAPI);
app.use(examAPI);

app.get('*', function(req, res){
    res.status(401).send({message:"URI does not exist"});
});
app.post('*', function(req, res){
    res.status(401).send({message:"URI does not exist"});
});
app.put('*', function(req, res){
    res.status(401).send({message:"URI does not exist"});
});
app.delete('*', function(req, res){
    res.status(401).send({message:"URI does not exist"});
});


app.get("/exam", verifyToken, async (req,res, next) => {
    if(req.user.type === "admin"){
        const data = await Exam.find({});
        res.json({message:"Success", data: data})
    }else{
        const data = await Exam.find({},{"_id":1, "dateTimeStart":1, "dateTimeEnd":1})
        res.json({message:"Success", data:data})
    }
})
app.put("/exam", verifyToken, async (req,res, next) => {
    if(req.user.type === "admin"){
        const {dateTimeStart, dateTimeEnd, duration, examId} = req.body;
        // const data = {
        //     month:date.getMonth(),
        //     day:date.getDay(),
        //     year:date.getFullYear(),
        //     hour:date.getHours(),
        //     sec:date.getSeconds(),
        //     min:date.getMinutes(),
        // }
        if(new Date(dateTimeStart) < new Date(dateTimeEnd)){
            res.json({message:"Invalid Date Time"})
        }
        try {
            const hour = duration.split('-')[0];
            const min = duration.split('-')[1];
            const date = new Exam({
                dateTimeStart : new Date(dateTimeStart),
                dateTimeEnd : new Date(dateTimeEnd),
                duration : hour+"-"+min,
                admin_id : req.user.id,
            })
            await date.findByIdAndUpdate( examId,(err, docs) =>{
                if(err) res.json({message:"Invalid Data"});
                res.json({message:"Success", data: docs});

            })
        } catch (error) {
            res.json({message:"Invalid Data"});
        } 
    }else{
        res.json({message:"Operation Denied"});
    }
})
app.delete("/exam", verifyToken, async (req,res, next) => {
    if(req.user.type === "admin"){
        await Exam.deleteOne({_id:req.body.examId}).then(
            async data => {
                await Question.deleteMany({exam_id:req.body.examId})
                .then(data =>{
                    if(data.deletedCount === 0){
                        res.json({message:"Fail", data:data});
                    }else{
                        res.json({message:"Success", data:data});
                    }
                })
            }
        )
        .catch(err => res.json({message:"Fail", err:err}));
    }else{
        res.json({message:"Access Denied"})
    }
})

//Records
app.post("/record", verifyToken, async (req, res, next) => {
    if(req.user.type === "admin"){
        res.json({message:"Why would an admin register a student record, eh?"});
    }else{
        const {examId, score, startDate, endDate, itemNumber} = req.body;
        const record = new Record({
            exam_id: examId,
            student_id: req.user.id,
            dateStart: startDate,
            dateEnd: endDate,
            itemNumber: itemNumber,
            score: score
        })
        await record.save((err, room)=>{
            if(err) res.json({message:"Error", err:err})
            res.json({message:"Success", id: room.id})
        })
    }

})
app.get("/record", verifyToken, async (req, res, next) => {
    if(req.user.type === "admin"){
        await Record.find({student_id:req.body.studentId})
            .then(data => {
                res.json({message:"Success", data: data})
        })
    }else{
        await Record.find({student_id:req.user.id})
            .then(data => {
                res.json({message:"Success", data: data})
            })
    }
})
app.get("/records", verifyToken, async (req,res, next) => {
    if(req.user.type === "admin"){
        await Record.find({student_id:req.user.id})
            .then(data => {
                res.json({message:"Success", data: data})
            })
    }else{
        res.json({message:"Access Denied"});
    }
})
app.delete("/record", verifyToken, async (req,res, next) => {
    if(req.user.type === "admin"){
        await Record.deleteOne({student_id:req.body.studentId})
        .then(data => {
            if(data.deletedCount === 0){
                res.json({message:"Fail", data:data});
            }else{
                res.json({message:"Success", data:data});
            }
        })
    }else{
        await Record.deleteOne({student_id:req.user.id})
            .then(data => {
                if(data.deletedCount === 0){
                    res.json({message:"Fail", data:data});
                }else{
                    res.json({message:"Success", data:data});
                }
            })
    }
})

//Questions
/**
 * type
 * examId
 * answer
 * choices[]
 */
app.post("/question", verifyToken, async (req,res, next) => {
    if(req.user.type === "admin"){
        const data = new Question({
            choices: req.body.choices,
            answer: req.body.answer,
            type: req.body.type,
            question: req.body.question,
            exam_id: req.body.examId
        })
        await data.save((err, doc)=>{
            if(err) res.json({message:"Fail", err: err})
            res.json({message:"Success", data: doc})
        })
    }else{
        res.json({message:"Access Denied"})
    }
})
app.get("/question", verifyToken, async (req, res, next)=>{
    if(req.user.type === "admin"){
        await Question.find({})
        .then(data => {
            res.json({message:"Success", data:data})
            }
        )
        .catch(err => res.json({message:"Fail", err:err}))
    }else{
        await Question.find({},{"question":1, "choices":1, "type":1, "exam_id":1})
        .then(data => {
            res.json({message:"Success", data:data})
            }
        )
        .catch(err => res.json({message:"Fail", err:err}))
    }
})
app.post("/question/answer", verifyToken, async (req,res, next) => {
    await Question.findById({_id: req.body.questionId})
        .then(data =>{
            if(req.body.answer === data.answer){
                res.json({message:"Correct", data:data})
            }else{
                res.json({message:"Incorrect"})
            }
        })
        .catch(err => res.json({message:"Something went wrong", err:err}))
})
app.delete("/question", verifyToken, async (req,res, next) => {
    if(req.user.type === "admin"){
        await Question.deleteOne({_id:req.body.questionId})
            .then(data =>{
                if(data.deletedCount === 0){
                    res.json({message:"Fail", data:data});
                }else{
                    res.json({message:"Success", data:data});
                }
            })
            .catch(err => res.json({message:"Something went wrong", err:err}))
    }else{
        res.json({message:"Access Denied"});
    }
})



//Database
mongoose.set("strictQuery", false);
mongoose.connect(dbURI, () => {
  console.log("Connected to MongoDB");
});
app.listen(port, () => 
    console.log("🔥Server is running on http:localhost:"+port)
);
