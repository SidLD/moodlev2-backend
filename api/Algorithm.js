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
                select: '_id firstName lastName age gender'
            })
            .populate({
                path: 'answers.question'
            })
            .exec( async (err, data) => {
                let km = new kClass();
                let kData = [];
                data.forEach(temp => {
                    kData.push({
                        gender: temp.student.gender,
                        score: temp.score
                    })
                });
                km.setClusterNumber(5);
                km.initClusterPoint(data);
                const temp = km.clusterPoints;

                //K-means
                res.status(200).send({message: "Ok", temp: data})
            })
    }else{
        res.status(401).send({message: "Access Denied"});
    }
})



class kClass{
    constructor(){
        this.k = 3;
        this.clusterPoints = [];
    }

    setClusterNumber = (param) => {this.k = param}

    //ex data = (1<an score san student>, 1< tos kun nanu na data na sa tingin tah significance sa score like age>)
    initClusterPoint = (data) => {
        for(var i = 0; i < this.k; i++){
            this.clusterPoints.push(Math.random(data.length))
        }
    }

    euclideanDistance = (pointA, clusterPoints) => {  
        var sum = 0;
        for (let i = 0; i < clusterPoints.length; i++) {
        sum += Math.pow(pointA[i] - clusterPoints[i], 2);
        }
        return Math.sqrt(sum);
    }

    assignDataToClusterPoints = (data) => {
        let assignments = [];
        for (let i = 0; i < data.length; i++) {
            let distances = [];
            for (let j = 0; j < clusterPoints.length; j++) {
            distances.push(euclideanDistance(data[i], centroids[j]));
            }
            let closestCentroidIndex = distances.indexOf(Math.min(...distances));
            assignments.push(closestCentroidIndex);
        }
        return assignments;
    }


    updateClusterPoints = (data, assignments, clusterPoints) => {
        let newClusterPoints = [];
        for (let i = 0; i < clusterPoints; i++) {
            //ig filter tah an data 
            let clusterPointsTemp = data.filter((point, index) => assignments[index] === i)
            if (clusterPoints.length === 0) {
                // If a centroid has no assigned points, leave it in place
                newClusterPoints.push(centroids[i]);
            } else {
                // Calculate the mean of the points in the cluster
                let newClusterPoint = clusterPoints[0].map((value, index) => {
                return clusterPoints.reduce((sum, point) => sum + point[index], 0) / clusterPointsTemp.length;
                });
                newClusterPoints.push(newClusterPoint);
            }
        }
        return newClusterPoints
    }

    run = () => {
        let assignments = assignDataToClusterPoints(data, clusterPoints);
        clusterPoints = updateClusterPoints(data, assignments, k);
    }

}

module.exports = app;