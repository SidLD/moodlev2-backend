const jwt = require('jsonwebtoken');

//functions
const verifyToken = async (req,res, next) => {
    const token = req.headers['x-access-token']?.split(' ')[1];
    //Decoded data = id, username, type
    // console.log(token);
    req.user = {};
    if(token){
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if(err) return res.json({
                isLoggingIn: false,
                message: "Failed to Authenticate",
                err: err
            })
            req.user.role = decoded.role;
            req.user.id = decoded.id;
            req.user.firstName = decoded.firstName;
            req.user.lastName = decoded.lastName;
            next(); 
        })
    }else{
        res.status(406).json({message:"Token Not Acceptable"})
    }
}

module.exports = verifyToken;