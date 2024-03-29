const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

const Category = require("../schemas/categorySchema");
const examSchema = require("../schemas/examSchema");

/**
 * An params id didi is '_id'.
 */

const { ObjectId } = mongoose.Types;

const getCategory = async (req, res) => {
  const params = req.query;
  //Dre dapat makita san student an log
  try {
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      Category.where(params)
        .populate({
          path: "log.user",
          select: "firstName lastName",
        })
        .exec((err, data) => {
          if (err) {
            res.status(400).send({ message: "Error", err: err.message });
            return;
          } else {
            res.status(200).send({ message: "Success", data: data });
            return;
          }
        });
    } else {
      await Category.where(params).then((data) => {
        data.forEach((element) => {
          element.log = undefined;
        });
        res.status(200).send({ message: "Success", data: data });
        return;
      });
    }
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};
/***
 * For Admin access only
 * Required Data
 * name
 */
const createCategory = async (req, res) => {
  try {
    const params = req.body;
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      try {
        const newCategory = new Category({
          name: params.name,
          // image : {
          //     data : params.img,
          //     contentType: "image/png"
          // }
        });
        newCategory.log.push({
          user: ObjectId(req.user.id),
          detail: "Created " + params.name,
        });
        await newCategory.save(async (err, data) => {
          if (err) {
            res.status(400).send({ message: "Error", error: err });
            return;
          } else {
            res.status(200).send({ message: "Success", data: data });
            return;
          }
        });
        // const data = params.img["$ngfDataUrl"];
        // res.status(200).send({ message: "Success", data: newCategory.data });
      } catch (error) {
        res.status(403).send({ message: "Success", error: error });
        return;
      }
    } else {
      res.status(400).send({ message: "Access Denied" });
      return;
    }
  } catch (error) {
    res.status(400).send({ message: "Something went wrong", err: error });
  }
};
/***
 * For Admin access only
 * Required Data
 * CategoryId
 */
const updateCategory = async (req, res) => {
  const params = req.body;
  if (req.user.role === "admin" || req.user.role === "superadmin") {
    try {
      await Category.findById(ObjectId(params._id)).then(
        async (room) => {
          if (room === null) {
            res.status(400).send({ message: "Category Does not exist" });
            return;
          } else {
            room.name = params.name;
            room.log.push({
              user: ObjectId(req.user.id),
              detail: "Modified to " + params.name,
            });
            await room.save(async (err, data) => {
              if (err) {
                res.status(400).send({ message: "Error", error: err });
                return;
              } else {
                res.status(200).send({ message: "Success", data: data });
                return;
              }
            });
          }
        }
      );
    } catch (error) {
      res.status(400).send({ message: "Error", error: error });
      return;
    }
  } else {
    res.status(400).send({ message: "Access Denied" });
    return;
  }
};
const deleteCategory = async (req, res, next) => {
  const category = req.body;
  try {
    if (req.user.role === "admin" || req.user.role === "superadmin") {
      const hasExam = await examSchema.find({category: ObjectId(category._id)})
      if (hasExam.length > 0) {
        return res.status(400).send({message: "Category is connected to an existing exam"})
      }
      await Category.deleteOne({ _id: category._id }).then((data) => {
        if (data.deletedCount === 1) {
          res
            .status(200)
            .send({ message: "Success", deletedCount: data.deletedCount });
          return;
        } else {
          res
            .status(400)
            .send({ message: "Fail", deletedCount: data.deletedCount });
          return;
        }
      });
    } else {
      res.status(400).send({ message: "Access Denied" });
      return;
    }
  } catch (error) {
    res.status(500).send({ message: "Error", err: error });
  }
};

exports.createCategory = createCategory;
exports.getCategory = getCategory;
exports.updateCategory = updateCategory;
exports.deleteCategory = deleteCategory;
