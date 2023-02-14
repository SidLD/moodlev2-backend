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
const Student = require("./schemas/userSchema");
const Admin = require("./schemas/adminSchema");
const Collection = require("./schemas/collectionSchema");
const Exam = require("./schemas/examSchema");
const Record = require("./schemas/recordSchema");
const Question = require("./schemas/questionSchema");

//Functions
const verifyToken = require("./Utilities/VerifyToken");
const { json } = require('body-parser');

//API
//Students
app.post("/student/register", async (req,res) => {
    //username, password, gender, email required
    const user = req.body;
    const ifTakenEmail = await Student.findOne({email: user.email});
    const ifTakenUsername = await Student.findOne({username: user.username});

    if(ifTakenEmail || ifTakenUsername){
        res.json({message:"Username or Email has been taken"});
    }else{
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const dbUser = new Student({
            username: user.username,
            email: user.email,
            password: hashedPassword,
            gender: user.gender
        })
        dbUser.save();
        res.json({message:"Success"});
    }
})
app.post("/student/login", async (req,res) => {
    const userLoggingIn = req.body;
    console.log(userLoggingIn);
    Student.findOne({email: userLoggingIn.email})
        .then(dbUser => {
            if(!dbUser) {
                return res.json({message:"Invalid Email or Password"})
            }
            bcrypt.compare(userLoggingIn.password, dbUser.password)
            .then(isMatch => {
                if(isMatch){
                    const payload = {
                        id: dbUser._id,
                        username: dbUser.username,
                        type: "student"            
                    }
                    jwt.sign(
                        payload,
                        process.env.JWT_SECRET,
                        {expiresIn: 86400},
                        (err, token) => {
                            if(err) return res.json({message: err});
                            return res.json({
                                message:"Success",
                                token: "Bearer "+token
                            });
                        }
                    )
                }else{
                    return res.json({message:"Invalid Email or Password"})
                }
            })
        })
})
app.get("/student", verifyToken, async (req,res) => {
    if(req.user.type === "student"){
       await Student.findById({_id: req.user.id})
            .then(dbUser => {
                const user = {
                    id : dbUser.id,
                    username : dbUser.username,
                    gender : dbUser.gender,
                    email : dbUser.email,
                    status : dbUser.status
                }
                res.json({isLoggingIn: true, data: user})
            })
            .catch(err => {
                res.json({message: "Failed", err:err})
            })

    }else if(req.user.type === "admin"){
        await Student.find({email:1, username:1, _id:1,gender:1, status:1})
            .then(data => {
                res.json({isLoggingIn: true, data: data})
            })
            .catch(err => {
                res.json({message: "Failed", err:err})
            })
    }
})
/**
    Required Data
    Student => oldPassword / newPassword
    Admin => studentId / newPassword
 */
app.post("/student/update/password", verifyToken, async (req,res) => {
    if(req.user.type === "student"){
       await Student.findById({_id: req.user.id})
            .then( async dbUser => {
                await bcrypt.compare(req.body.oldPassword, dbUser.password)
                .then( async isMatch => {
                    if(isMatch){
                        const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
                        await Student.findByIdAndUpdate({_id: req.user.id},{password:hashedPassword})
                                .then(
                                    res.json({message: "Success"})
                                )
                                .catch(err => {
                                    res.json({message:"Failed", err: err});
                                })
                    }else{
                        res.json({message:"Incorrect Credintials"});   
                    }
                })
                .catch(err => {
                    res.json({message: "Failed", err: err})
                });
            })
            .catch(err => {
                res.json({message: "Failed", err:err})
            })

    }else if(req.user.type === "admin"){
        //old password, and new password, id
        const hashedPassword = await bcrypt.hash(req.data.newPassword, 10);
        await Student.findByIdAndUpdate({_id: req.studentId},{password:hashedPassword})
                .then(
                    res.json({message: "Success"})
                )
                .catch(err => {
                    res.json({message:"Failed", err: err});
                })
    }
})
/**
 * 
    Required Data
    Student => gender / email
    Admin => studentId / gender, email, status
 */
app.post("/student/update", verifyToken, async (req,res) => {
    if(req.user.type === "student"){
        const data = {
            gender: req.body.gender,
            email: req.body.email
        }
        await Student.findByIdAndUpdate({_id: req.user.id},{data})
        .then(
            res.json({message: "Success"})
        )
        .catch(err => {
            res.json({message:"Failed", err: err});
        })
    }else if(req.user.type === "admin"){
        const data = {
            gender: req.body.gender,
            email: req.body.email,
            status: req.body.status
        }
        await Student.findByIdAndUpdate({_id: req.body.studentId},{data})
        .then(
            res.json({message: "Success"})
        )
        .catch(err => {
            res.json({message:"Failed", err: err});
        })
    }
})
/**
    Required Data
    Student => password / email
    Admin => studentId
 */
app.delete("student", verifyToken, async (req,res) => {
    if(req.user.type === "student"){
        await Student.findOne({_id:req.user.id, email: req.body.email})
            .then( async dbUser => {
                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                await bcrypt.compare(hashedPassword, dbUser.password)
                    .then(async isMatch => {
                        if(isMatch){
                            await Student.deleteOne({_id:req.user.id})
                            .then(
                                res.json({message: "Success"})
                            )
                            .catch(err => {
                                res.json({message: "Failed", err:err})
                            })
                        }else{
                            res.json({message: "Incorrect Email"})
                        }
                    })
                    .catch()
            })
            .catch()

    }
    else if(req.user.type === "admin"){
        await Student.deleteById(req.studentId)
        res.json({message: "Success"});
    }
})



//Collections
app.get("/collection", async (req,res) => {
    await Collection.find({})
    .then(data => {
        res.json({message: "Success", data: data})
    })
})
/***
 * For Admin access only
 * Required Data
 * name
 */
app.post("/collection", verifyToken, async (req,res) => {
    console.log(req.body)
    if(req.user.type === "admin"){
        const newCollection = new Collection({
            name: req.body.name
        })
        await newCollection.save((err, room)=>{
            if(err) res.json({message:"Error", err:err})
            res.json({message:"Success", id: room.id})
        })
    }else{
        res.json({message:"Access Denied"})
    }
})
/***
 * For Admin access only
 * Required Data
 * collectionId
 */
app.delete("/collection", verifyToken, async (req,res) => {
    if(req.user.type === "admin"){
       await Collection.deleteOne({_id:req.body.collectionId})
        .then(data => {
            if(data.deletedCount === 0){
                res.json({message:"Fail", data:data});
            }else{
                res.json({message:"Success", data:data});
            }
        })
       
    }else{
        res.json({message: "Operation Denied"})
    }
})






//Admin
app.post("/admin/register", verifyToken,async (req,res) => {
    //username, password, gender, email required
    if(req.user.type === "admin"){
        const user = req.body;
        const ifTakenEmail = await Admin.findOne({email: user.email});
        const ifTakenUsername = await Admin.findOne({username: user.username});

        if(ifTakenEmail || ifTakenUsername){
            res.json({message:"Username or Email has been taken"});
        }else{
            const hashedPassword = await bcrypt.hash(user.password, 10);
            const dbUser = new Admin({
                username: user.username,
                email: user.email,
                password: hashedPassword,
                gender: user.gender
            })
            dbUser.save();
            res.json({message:"Success"});
        }
    }else{
        res.json({message:"Operation Denied"});
    }
})
app.post("/admin/login", async (req,res) => {
    const userLoggingIn = req.body;
    Admin.findOne({email: userLoggingIn.email})
        .then(dbUser => {
            if(!dbUser) {
                return res.json({message:"Invalid Email or Password"})
            }
            bcrypt.compare(userLoggingIn.password, dbUser.password)
            .then(isMatch => {
                if(isMatch){
                    const payload = {
                        id: dbUser._id,
                        username: dbUser.username,
                        type: "admin"            
                    }
                    jwt.sign(
                        payload,
                        process.env.JWT_SECRET,
                        {expiresIn: 86400},
                        (err, token) => {
                            if(err) return res.json({message: err});
                            return res.json({
                                message:"Success",
                                token: "Bearer "+token
                            });
                        }
                    )
                }else{
                    return res.json({message:"Invalid Email or Password"})
                }
            })
        })
})
app.get("/admin", verifyToken, async (req,res) => {
    if(req.user.type === "admin"){
       await Admin.findById({_id: req.user.id})
            .then(dbUser => {
                const user = {
                    id : dbUser.id,
                    username : dbUser.username,
                    gender : dbUser.gender,
                    email : dbUser.email,
                    status : dbUser.status
                }
                res.json({isLoggingIn: true, data: user})
            })
            .catch(err => {
                res.json({message: "Failed", err:err})
            })

    }else {
        res.json({message: "Access Denied"})
    }
})

//Exams
app.post("/exam", verifyToken, async (req,res) => {
    if(req.user.type === "admin"){
        const {dateTimeStart, dateTimeEnd, collectionId, duration} = req.body;
        // const data = {
        //     month:date.getMonth(),
        //     day:date.getDay(),
        //     year:date.getFullYear(),
        //     hour:date.getHours(),
        //     sec:date.getSeconds(),
        //     min:date.getMinutes(),
        // }
        try {
            const hour = duration.split('-')[0];
            const min = duration.split('-')[1];
            const date = new Exam({
                dateTimeStart : new Date(dateTimeStart),
                dateTimeEnd : new Date(dateTimeEnd),
                duration : hour+"-"+min,
                admin_id : req.user.id,
                collection_id : collectionId
            })
            await date.save(function(err,room) {
                if(err) res.json({message:"Invalid Data"});
                res.json({message:"Success", id:room.id, data: date});
             });
        } catch (error) {
            res.json({message:"Invalid Data"});
        } 
    }else{
        res.json({message:"Operation Denied"});
    }
})
app.get("/exam", verifyToken, async (req,res) => {
    if(req.user.type === "admin"){
        const data = await Exam.find({});
        res.json({message:"Success", data: data})
    }else{
        const data = await Exam.find({},{"_id":1, "dateTimeStart":1, "dateTimeEnd":1})
        res.json({message:"Success", data:data})
    }
})
app.put("/exam", verifyToken, async (req,res) => {
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
app.delete("/exam", verifyToken, async (req,res) => {
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
app.post("/record", verifyToken, async (req, res) => {
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
app.get("/record", verifyToken, async (req, res) => {
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
app.get("/records", verifyToken, async (req,res) => {
    if(req.user.type === "admin"){
        await Record.find({student_id:req.user.id})
            .then(data => {
                res.json({message:"Success", data: data})
            })
    }else{
        res.json({message:"Access Denied"});
    }
})
app.delete("/record", verifyToken, async (req,res) => {
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
app.post("/question", verifyToken, async (req,res) => {
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
app.get("/question", verifyToken, async (req, res)=>{
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
app.post("/question/answer", verifyToken, async (req,res) => {
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
app.delete("/question", verifyToken, async (req,res) => {
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
