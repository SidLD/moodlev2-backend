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


//API
const userAPI = require("./api/user");
const categoryAPI = require("./api/category");
const examAPI = require("./api/exam");
const questionAPI = require("./api/question");
const recordAPI = require("./api/record");
const analysisAPI = require("./Utilities/Algorithm")

app.use(userAPI);
app.use(categoryAPI);
app.use(examAPI);
app.use(questionAPI);
app.use(recordAPI);
app.use(analysisAPI);

app.get('*', function(req, res){
    res.status(404).send({message:"URI does not exist"});
});
app.post('*', function(req, res){
    res.status(404).send({message:"URI does not exist"});
});
app.put('*', function(req, res){
    res.status(404).send({message:"URI does not exist"});
});
app.delete('*', function(req, res){
    res.status(404).send({message:"URI does not exist"});
});


//Database
mongoose.set("strictQuery", false);
mongoose.connect(dbURI, () => {
  console.log("Connected to MongoDB");
});
app.listen(port, () => 
    console.log("🔥Server is running on http:localhost:"+port)
);
