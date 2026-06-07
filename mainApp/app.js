const dotenv = require('dotenv');
dotenv.config();
const pool = require('./db.js');
const express = require("express");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express()
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const port = 3000;

app.use(express.static('public'));

dotenv.config();

console.log(process.env.DATABASE_URL);

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


async function getCount(table) {
    const result = await pool.query(`SELECT COUNT(*) FROM ${table}`);
    return parseInt(result.rows[0].count);
}

app.get('/stats', async (req, res) =>  {
    try {
        const userNum = await getCount('users');
        const jobNum = await getCount('job');
        res.json({ users: userNum, jobs: jobNum });
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

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({success: false, message: 'No token provided.'});
    }
    jwt.verify(token, JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(403).json({success: false, message: 'Invalid or expired token'})
        }
        req.user = payload;
        next()
    });
    
}


//signup
app.post('/signup', async (req, res) => {
    const { firstname, lastname, email, password, Address } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO users (firstname, lastname, email, password) VALUES ($1, $2, $3, $4) RETURNING *', [firstname, lastname, email, hashedPassword]);
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(400).json({ success: false, message: 'Server error' });
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

//==================================Profile===============================

app.get('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT firstname, lastname, email, address FROM users WHERE id = $1', 
            [req.user.id]
        );

        if (result.rows.lenght === 0) {
            return res.status(404).json({ success: false, message: 'User not found.'})
        }

        res.json({ success: true, user: result.rows[0] });
    }catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error."});

    }
    
});

app.put('/profile', authenticateToken, async (req, res) => {
    const {firstname, lastname, email, address} = req.body;
    try {
        const result = await pool.query(
            `Update users
            SET firstname = $1, lastname = $2, email = $3, address = $4
            WHERE id = $5
            RETURNING firstname, lastname, email , address`,
            [firstname, lastname, email, address, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found.'})
        }

        res.json({success:true, user : result.rows[0] });
    }catch (err) {
        console.error(err);
        res.status(500).json( { success: false, message: 'Server error.'});
    }
});