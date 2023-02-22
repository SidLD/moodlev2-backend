const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();

const Category = require("../schemas/categorySchema")
const verifyToken = require("../Utilities/VerifyToken")

/**
 * An params id didi is '_id'.
 */

app.get("/category", verifyToken, async (req,res, next) => {
    const params = req.body;
    //Pag may name ngane sa params ig search nala an name with 'like';
    //pag wara then pasa an params
    //Dre dapat makita san student an log
    if(params.name){
        await Category.where({"name":{ $regex: '.*' + params.name+ '.*'}})
        .then(data => {
            if(req.user.role === "admin"){
                return res.status(200).send({message: "Success", data: data})
            }else{
                data.forEach(element => {
                    element.log = undefined   
                });
                return res.status(200).send({message: "Success", data: data})
            }
        })
    }else{
        await Category.where({params})
            .then(data => {
                if(req.user.role === "admin"){
                    return res.status(200).send({message: "Success", data: data})
                }else{
                    data.forEach(element => {
                        element.log = undefined   
                    });
                    return res.status(200).send({message: "Success", data: data})
                }
        })
    }
})
/***
 * For Admin access only
 * Required Data
 * name
 */
app.post("/category", verifyToken, async (req,res, next) => {
    const params = req.body;
    if(req.user.role === "admin"){
        const newCategory = new Category({
            name: params.name
        })
        await newCategory.save( async (err, room)=>{
            if(err) {
                return res.status(400).send({message:"Error", err:err})
            }
            room.log.push({
                _id: mongoose.Types.ObjectId(req.user.id),
                detail: "Created "+params.name
            })
            await room.save(async (err, data) => { 
                if(err) {
                    return res.status(400).send({message:"Error", error:err})
                }
                return res.status(200).send({message:"Success", data: data})
            })
        })
    }else{
       return res.status(400).send({message:"Access Denied"})
    }
})
/***
 * For Admin access only
 * Required Data
 * CategoryId
 */
app.put("/category", verifyToken, async (req,res, next) => {
    const category = req.body;
    if(req.user.role === "admin"){
        await Category.findById(mongoose.Types.ObjectId(category._id))
            .then(async (room) => {
                if(!room) {
                    return res.status(400).send({message:"Categry Does not exist"})
                }
                room.name = category.name;
                await room.save(async (err, data) => {
                    if(err) {
                        return res.status(400).send({message:"Error", error:err})
                    }
                    room.log.push({
                        _id: mongoose.Types.ObjectId(req.user.id),
                        detail: "Modified to "+category.name
                    })
                    await room.save(async (err, data) => { 
                        if(err) {
                            return res.status(400).send({message:"Error", error:err})
                        }
                        return res.status(200).send({message:"Success", data: data})
                    })
                })
                
            })
    }
    return res.status(400).send({message: "Access Denied"})
})

app.delete("/category", verifyToken, async (req,res, next) => {
    const category = req.body;
    if(req.user.type === "admin"){
       await Category.deleteOne({_id:category._id})
        .then(data => {
            if(data.deletedCount === 1){
                return res.status(200).send({message:"Success", deletedCount:data.deletedCount});
            }else{
               return res.status(401).send({message:"Fail", deletedCount:data.deletedCount});   
            }
        })
       
    }else{
        return res.status(400).send({message: "Access Denied"})
    }
})


module.exports = app