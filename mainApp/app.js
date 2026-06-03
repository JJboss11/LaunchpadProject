const dotenv = require('dotenv');
dotenv.config();

const pool = require('./db.js');
const express = require("express");
const app = express()
const port = 3000;

app.use(express.static('public'));

app.get("/", (req, res) => {
    res.sendFile('index.html', (err) => {
        if (err)
            console.log(err);
    });
});

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ success: true, time: result.rows[0].now });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.listen(port, () => {
    console.log(`MyApp is listening on port ${port}!`);
});