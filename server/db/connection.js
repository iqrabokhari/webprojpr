const mongoose = require('mongoose');

const mongoDb = "mongodb://localhost:27017/proconnectDB";

// Connect to MongoDB using Mongoose
const connection = mongoose.connect(mongoDb, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB is connected");
  })
  .catch((err) => {
    console.error("Unable to connect to MongoDB:", err);
  });

module.exports = connection;
