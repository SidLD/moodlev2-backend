const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

const Category = require("../schemas/categorySchema");
const Exam = require("../schemas/examSchema");
const Compare = require("../schemas/compareSchema");

const {getCompareR} = require("../repositories/comapareRepository")


const { ObjectId } = mongoose.Types;

const getCompare = async (req, res) => {
    const params = req.query;
    //Dre dapat makita san student an log
    try {
        const data = await getCompareR(params)
        
        return res.status(200).send({ message: "Success", data: data });
    } catch (error) {
      return res.status(400).send({ message: "Error", err: error });
    }
  };

  const createCompare = async (req, res) => {
    try {
      const params = req.body;
        try {
          const newCompare = new Compare({
            user: ObjectId(params.user),
            exam: ObjectId(params.exam),
            forecast: params.forecast,
            boardExamResult: params.boardResult,
            
          });
          await newCompare.save(async (err, data) => {
            if (err) {
                return res.status(400).send({ message: "Error", error: err });
              
            } else {
                return res.status(200).send({ message: "Success", data: data });
              
            }
          });
          // const data = params.img["$ngfDataUrl"];
          // res.status(200).send({ message: "Success", data: newCategory.data });
        } catch (error) {
            return res.status(403).send({ message: "Success", error: error });
          
        }
      
    } catch (error) {
      res.status(400).send({ message: "Something went wrong", err: error });
    }
  };


exports.getCompareData = getCompare;

exports.createCompare = createCompare;