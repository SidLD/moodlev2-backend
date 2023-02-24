const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const verifyToken = require("../Utilities/VerifyToken")
const Exam = require("../schemas/examSchema");
const User = require("../schemas/userSchema");
const Record = require("../schemas/recordSchema");

app.post('/record', verifyToken, async (req, res) => {
    const params = req.body;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
        try {
            // const {exam, timeStart, timeEnd, answers} = params;
            res.status(200).send({message: "Success", data: params});
        } catch (error) {
            return res.status(300).send({message: "Something Went Wrong", error:error.message})
        } 
    }else{
       return res.status(401).send({message: "Access Denied"})
    }
})



module.exports = app