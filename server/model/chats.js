const mongoose = require('mongoose');

const chats = new mongoose.Schema({
    
    sender_id:  String    ,
    receiver_id:  String  ,
    message: [String], 
    time: {
        type: Date,
        default: Date.now
    }

  
});

module.exports = mongoose.model("chats",chats)