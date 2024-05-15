const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    Fname: String,
    Lname: String,
    email: String,
    password: String,
    region: String,
    industry: String,
    Company: String,
  
});

module.exports = mongoose.model("userzs",userSchema)