const express = require('express');
const connection = require('./db/connection');
const app = express();
const cors = require('cors');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const Users = require('./model/user');
const Chat = require('./model/chats');
const EventEmitter = require('events');
const { verifyToken } = require('./auth.js');

// Increase the maximum number of listeners for the event emitter
EventEmitter.defaultMaxListeners = 15; // You can adjust this number as needed

app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true,
}));
app.use(express.json());

// signup
app.post("/signup", async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await Users.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        let user = new Users({
            email: req.body.email,
            password: hashedPassword,
            // Add other fields if necessary
        });

        let result = await user.save();
        res.status(201).json(result);
    } catch (error) {
        console.error('Signup Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// login
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await Users.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'User does not exist' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        // Generate token
        
        const token = jwt.sign({ userId: user._id }, 'secret_key', { expiresIn: '1h' });
        console.log('token', token);

        // Set the cookie in the response
        res.cookie(String(user._id), token, {
            path: "/",
            expires: new Date(Date.now() + 1000 * 60 * 60), // Token expires in 1 hour
            httpOnly: true,
            sameSite: "lax",
        });

        // Respond with the token
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// CHAT AREA
app.post("/send-message", verifyToken, async (req, res) => {
    try {
        const { sender_id, receiver_id, message } = req.body;

        const newMessage = new Chat({
            sender_id,
            receiver_id,
            message,
            time: Date.now()
        });

        const savedMessage = await newMessage.save();
        res.status(200).json(savedMessage);
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get("/messages/:userId", verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, 'secret_key');
        const decodedUserId = decodedToken.userId;

        if (decodedUserId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const messages = await Chat.find({
            $or: [
                { sender_id: userId },
                { receiver_id: userId }
            ]
        });

        res.status(200).json(messages);
    } catch (error) {
        console.error('Retrieve Messages Error:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
});
