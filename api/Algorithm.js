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
                const dataTemp = [
                    [25, 85],
                    [42, 73],
                    [57, 60],
                    [36, 68],
                    [22, 92],
                    [58, 50],
                    [48, 78],
                    [33, 64],
                    [55, 59],
                    [28, 87]
                  ];
                km.setClusterNumber(3);
                let clusterPoints = km.initClusterPoint(dataTemp);
                let assignments = km.initAssignDataToCluster(dataTemp, clusterPoints);
                let newClusterPoints = km.getNewClusterPoint(assignments)
                let isMatch = false;
                function equalsCheck(a, b) {
                    // check the length
                    if (a.length != b.length) {
                        return false;
                    } else {
                        let result = false;
                
                        // comparing each element of array 
                        for (let i = 0; i < a.length; i++) {
                
                            if (a[i][0] !== b[i][0] && a[i][1] !== b[i][1] ) {
                                return false;
                            } else {
                                result = true;
                            }
                        }
                        return result;
                    }
                }

                for(let s = 0; s < 5; s++){
                    if(equalsCheck(clusterPoints, newClusterPoints)){
                        isMatch = true
                    }else{
                        isMatch = false
                    }
                
                    if(!isMatch){
                        clusterPoints = newClusterPoints;
                        assignments = km.initAssignDataToCluster(dataTemp, clusterPoints);
                        newClusterPoints = km.getNewClusterPoint(assignments)
                    }
                    console.log(isMatch)
                }

                res.status(200).send({message: "Ok", temp: assignments})
            })
    }else{
        res.status(401).send({message: "Access Denied"});
    }
})



class kClass{
    constructor(){
        this.k = 3;
    }

    setClusterNumber = (param) => {this.k = param}

    //ex data = (1<an score san student>, 1< tos kun nanu na data na sa tingin tah significance sa score like age>)
    initClusterPoint = (data) => {
        let indexs = [];
        let clusterPoints = [];
        for(let i = 0; i< this.k; i++){    
            let randomIndex = Math.floor(Math.random() * data.length);  
            while(indexs.includes(randomIndex) && indexs.length < data.length){
                randomIndex = Math.floor(Math.random() * data.length);    
            }
            clusterPoints.push(data[randomIndex]);
            indexs.push(randomIndex);
        }
        return clusterPoints;
    }

    //euclidean distance ine, an sum san sqrt difference san duha na points ie ([1,2], [1,3])
    euclideanDistance = (pointA, clusterPoint) => {  
        const data1 = Math.pow(pointA[0] - clusterPoint[0] , 2)
        const data2 = Math.pow(clusterPoint[1] - pointA[1], 2)
        return Math.sqrt(data1 + data2);
    }

    initAssignDataToCluster = (data, clusterPoints) => {
        let clusterAssignments = [];
        for (let j = 0; j < clusterPoints.length; j++) {
            clusterAssignments.push({
                clusterPoint: clusterPoints[j],
                data: []
            })
        }
        for (let i = 0; i < data.length; i++) {
            //init
            let minDistance = this.euclideanDistance(data[i], clusterPoints[0]);;
            let closestCluster = clusterPoints[0];
            //Kuhaon an distance san cluster pati an data then 
            for (let j = 0; j < clusterPoints.length; j++) {
                const newDistance = this.euclideanDistance(data[i], clusterPoints[j]);
                if(minDistance > newDistance){
                    minDistance = newDistance;
                    closestCluster = clusterPoints[j];
                }
            }
            //igAssign kun hain an pinakaHarani na clusterPoint
            for(let k = 0; k < clusterAssignments.length; k++){
                if(clusterAssignments[k].clusterPoint === closestCluster){
                    clusterAssignments[k].data.push(data[i]);
                }
            }
        }
        return clusterAssignments;
    }

    getNewClusterPoint = (assignments) => {
        let newClusterPoints = [];
        assignments.forEach(data => {
            if(data.data.length < 2){
                newClusterPoints.push(data.clusterPoint)
            }else{
                let sumA = 0, sumB = 0;
                data.data.forEach(point => {
                    sumA += point[0],
                    sumB += point[1]
                })
                const pointA = sumA / data.data.length;
                const pointB = sumB / data.data.length;
                newClusterPoints.push(
                    [pointA, pointB]
                )
            }
        })
        return newClusterPoints;
    }
}

module.exports = app;