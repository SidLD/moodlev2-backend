const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const verifyToken = require("../Utilities/VerifyToken");
const Record = require("../schemas/recordSchema");

app.get("/analysis", verifyToken, async (req,res, next) => {
    const params = req.query;
    //Dre dapat makita san student an log
    if(req.user.role === 'admin' || req.user.role === 'superadmin'){
        Record.where({})
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


                
                res.status(200).send({message: "Ok"})
            })
    }else{
        res.status(401).send({message: "Access Denied"});
    }
})

module.exports = app;