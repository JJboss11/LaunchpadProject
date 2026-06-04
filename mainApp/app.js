const dotenv = require('dotenv');
dotenv.config();

const pool = require('./db.js');
const express = require("express");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express()
app.use(express.json());
const port = 3000;

app.use(express.static('public'));


//====================================MISC===============================
//load up the login page on startup
app.get("/", (req, res) => {
    res.sendFile('login.html', (err) => {
        if (err)
            console.log(err);
    });
});

//internal test-tb func for testing purposes
app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0].now });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

//terminal debug for nodemon
app.listen(port, () => {
    console.log(`MyApp is listening on port ${port}!`);
});

//====================================LOGIN/SIGNUP======== d===============================

const JWT_SECRET = process.env.JWT_TOKEN; 

//signup
app.post('/signup', async (req, res) => {
    const { name, lastname, email, password, Address } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO users (firstname, lastname, email, password, address) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, lastname, email, hashedPassword, Address]);
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: 'Email already exists.' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const match = await bcrypt.compare(password, user.password);
        
        if (!match) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ success: true, token });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});