const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const Users = require('./model/user');
const EventEmitter = require('events');

// Increase the maximum number of listeners for the event emitter
EventEmitter.defaultMaxListeners = 15; // You can adjust this number as needed

// Rest of your code


const verifyToken = (req, res, next) => {   
    const cookies = req.headers.cookie;
    if (!cookies) {
        return res.status(404).json({ message: "Cookies not found" });
    }
    
    // Split cookies string into individual cookies
    const cookieArray = cookies.split(';');
    
    // Iterate through each cookie
    for (const cookie of cookieArray) {
        const [name, value] = cookie.trim().split('=');
        // Assuming your token cookie has a specific name, for example, 'token'
        if (name === 'token') {
            console.log(`Cookie Name: ${name}, Value: ${value}`);
            jwt.verify(value, 'secret_key', (err, user) => {
                if (err){
                    return res.status(400).json({message: "Invalid Token"})
                }
                console.log(user.id);
                req.id = user.id;
            });
            console.log("verified successfully");
            break; // Exit loop once token is found
        }
    }
    next();
};

const verifyRefresh = (req, res) => {   
    const cookies = req.headers.cookie;
    if (!cookies) {
        return res.status(404).json({ message: "Cookies not found" });
    }
    const token = cookies.split('=')[1];
    if (!token) {
        return res.status(404).json({ message: "Token not found" });
    }
    jwt.verify(String(token), 'secret_key', (err, user) => {
        if (err){
            return res.status(400).json({message: "Invalid Token"})
        }
        console.log(user.id);
        req.id = user.id;
    });
    return res.status(200).json({ message: "Token Refreshed and Verified Successfully" });
};

const refreshToken = (req, res, next) => {   
    const cookies = req.headers.cookie;
    if (!cookies) {
        return res.status(400).json({message: "Couldn't find cookies"})
    }
    const prevToken = cookies.split('=')[1];
    if (!prevToken) {
        return res.status(400).json({message: "Couldn't find token"})
    }
    jwt.verify(String(prevToken), 'secret_key', (err, user) => {
        if (err){
            console.log(err);
            return res.status(403).json({message: "Authentication failed"});
        }
        res.clearCookie(user.id.toString());
        req.cookies[user.id] = "";
        const token = jwt.sign({id: user.id}, 'secret_key', {
            expiresIn: "35s"
        });
        console.log("Re-generated Token\n", token);
        res.cookie(String(user.id), token, {
            path:"/",
            expires: new Date(Date.now() + 1000 * 30),
            httpOnly: true,
            sameSite: "lax",
        })
        req.id = user.id;
    });
    next();
}

const logout = (req, res) => {
    const cookies = req.headers.cookie;
    const prevToken = cookies.split('=')[1];
    if (!prevToken) {
        return res.status(400).json({message: "Couldn't find token"})
    }
    jwt.verify(String(prevToken), 'secret_key', (err, user) => {
        if (err){
            console.log(err);
            return res.status(403).json({message: "Authentication failed"});
        }
        res.clearCookie(user.id.toString());
        req.cookies[user.id] = "";
        return res.status(200).json({message: "Successfully Logged Out"});
    });
}

module.exports.logout = logout;
module.exports.verifyToken = verifyToken;
module.exports.refreshToken = refreshToken;
module.exports.verifyRefresh = verifyRefresh;
