const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const Category = require("../schemas/categorySchema")

/**
 * An params id didi is '_id'.
 */

const getCategory =  async (req,res) => {
    const params = req.query;
    //Dre dapat makita san student an log
    if(req.user.role === 'admin' || req.user.role === 'superadmin'){
        Category
            .where(params)
            .populate({
                path: 'log.user',
                select: 'firstName lastName'
            })
            .exec((err, data) => {
                if (err) {
                    res.status(400).send({message: "Error", err: err.message})
                }else{
                    res.status(200).send({message: "Success", data: data})
                }
            });
    }else{
        await Category
            .where(params)
            .then(data => {
                data.forEach(element => {
                    element.log = undefined   
                });
                res.status(200).send({message: "Success", data: data})
            })
    }
}
/***
 * For Admin access only
 * Required Data
 * name
 */
const createCategory = async (req,res) => {
    const params = req.body;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
        try {
            const newCategory = new Category({
                name: params.name
            })
            newCategory.log.push({
                user:  mongoose.Types.ObjectId(req.user.id),
                detail: "Created "+params.name
            })
            await newCategory.save( async (err, data)=>{
                if(err){
                    res.status(400).send({message:"Error", error:err})
                }else{
                    res.status(200).send({message:"Success", data: data})
                }
            })
        } catch (error) {
            res.status(403).send({message:"Success", error: error})
        }
    }else{
        res.status(400).send({message:"Access Denied"})
    }
}
/***
 * For Admin access only
 * Required Data
 * CategoryId
 */
const updateCategory  = async (req,res) => {
    const params = req.body;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
        try {
            await Category.findById(mongoose.Types.ObjectId(params._id))
            .then(async (room) => {
                if(room === null) {
                    res.status(400).send({message:"Category Does not exist"})
                }
                else {
                    room.name = params.name;
                    room.log.push({
                        user: mongoose.Types.ObjectId(req.user.id),
                        detail: "Modified to "+params.name
                    })
                    await room.save(async (err, data) => {
                        if(err) {
                            res.status(400).send({message:"Error", error:err})
                        }else {
                            res.status(200).send({message:"Success", data: data})
                        }
                    })
                }
            })
        } catch (error) {
            res.status(400).send({message:"Error", error:error})
        }
    }else{
        res.status(400).send({message: "Access Denied"})
    }
}
const deleteCategory =  async (req,res, next) => {
    const category = req.body;
    if(req.user.role === "admin" || req.user.role === "superadmin"){
       await Category.deleteOne({_id:category._id})
        .then(data => {
            if(data.deletedCount === 1){
                 res.status(200).send({message:"Success", deletedCount:data.deletedCount});
            }else{
                res.status(400).send({message:"Fail", deletedCount:data.deletedCount});   
            }
        })
       
    }else{
         res.status(400).send({message: "Access Denied"})
    }
}


exports.createCategory = createCategory;
exports.getCategory  = getCategory;
exports.updateCategory   = updateCategory;
exports.deleteCategory = deleteCategory;
