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

dotenv.config()
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

//get row count of table
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

//config
app.get('/config', (req, res) => {
    res.json({
        supabaseUrl: process.env.GEN_SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    });
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
        const result = await pool.query(
            `INSERT INTO users (firstname, lastname, email, password) 
            VALUES ($1, $2, $3, $4) 
            RETURNING id, email`, 
            [firstname, lastname, email, hashedPassword]
        );

        const user = result.rows[0];

        const token = jwt.sign(
            {id: user.id, email: user.email},
            JWT_SECRET,
            {expiresIn: '7d'}
        );
        
        res.json({ success: true, token})

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
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

        if (result.rows.length === 0) {
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

app.delete('/profile', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [req.user.id]
        );

        if (result.rows.length === 0 ) {
            return res.status(404).json({ success: false, message: 'User no found.'});
        }

        res.json( {success: true, message: 'Account deleted.'});
    } catch (err) {
        console.error (err) 
        res.status(500).json( {success: false, message: 'Server error' });
    }
});

app.get('/profile/stats', authenticateToken, async (req, res) => {
    try {
        const active = await pool.query(
            `SELECT COUNT (*) FROM job_claim WHERE user_id = $1 AND status = 'Claimed'`,
            [req.user.id]
        );
        const completed = await pool.query(
            'SELECT COUNT (*) FROM past_jobs WHERE user_id = $1',
            [req.user.id]
        );

        res.json({
            success: true,
            stats: {
                active: parseInt(active.rows[0].count),
                completed: parseInt(completed.rows[0].count)
            }
        });
    }catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

app.get('/profile/completed-tasks', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT j.id, j.title, j.description, j.task_date, j.task_time
            FROM past_jobs pj
            JOIN job j ON j.id = pj.job_id
            WHERE pj.user_id = $1
            ORDER BY j.task_date NULLS LAST`,
            [req.user.id]
        );
        res.json({ success: true, tasks: result.rows});
    }catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error'});
    }
});

app.get('/profile/active-tasks', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT j.id, j.title, j.description, j.job_location, j.task_date, j.task_time
            FROM job_claim jc
            JOIN job j ON j.id = jc.job_id
            WHERE jc.user_id = $1 AND jc.status = 'Claimed'
            ORDER BY j.task_date NULLS LAST`,
            [req.user.id]
        );

        res.json({ success: true, tasks: result.rows});
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error'});
    }
});

app.get('/profile/reported-tasks', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
            j.id, j.title, j.description, j.task_date, j.task_time,
            COALESCE(
                json_agg(
                    json_build_object(
                        'firstname', u.firstname,
                        'lastname', u.lastname,
                        'email', u.email
                        )
                    ) FILTER (WHERE u.id IS NOT NULL),
                    '[]'
                ) AS volunteers
            From job j
            LEFT JOIN job_claim jc ON jc.job_id = j.id
            LEFT JOIN users u ON u.id = jc.user_id
            WHERE j.poster_id = $1 AND j.status <> 'Done'
            GROUP BY J.id
            ORDER BY j.created_at`,
            [req.user.id]
        );

        res.json({success: true, tasks: result.rows});
    }catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.delete('/tasks/:id', authenticateToken, async (req, res) => {
    const jobId = parseInt(req.params.id, 10);
    if (!Number.isInteger(jobId)) {
        return res.status(400).json({ success: false, message: 'Invalid task id.'})
    }

    const client = await pool.connect();

    try {
        const job = await client.query('SELECT poster_id FROM job WHERE id = $1',
            [jobId]);
        if (job.rows[0].length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found'});
        }
        
        if (job.rows[0].poster_id !== req.user.id) {
            return res.status(403).json( {success: false, message: 'You can only cancle your own tasks'});
        }

        await client.query('BEGIN');
        await client.query('DELETE FROM job_claim WHERE job_id = $1', [jobId])
        await client.query('DELETE FROM job WHERE id = $1', [jobId])
        await client.query('COMMIT');

        res.json({ success: true, message: 'Task cancelled'})
    }catch(err) {
        await client.query('ROLLBACK');
        console.error(err)
        res.status(500).json({ success: false, message: 'Server error'})
    }finally {
        client.release();
    }
});

//==================================Task===============================
app.post('/tasks', authenticateToken, async (req, res) => {
    const {title, description, category, address, time, date, volunteers, image_location} = req.body;

    const errors = [];

    if (!title || title.trim() == '') {
        errors.push('Title is required.');
    }else if (title.length > 255) {
        errors.push('Title must be 255 characters or fewer.')
    }

    if (!description || description.trim() == '') {
        errors.push('Description is required.');
    }

    if (!category) {
        errors.push("Please select a category");
    }

    const volunteering = parseInt(volunteers, 10);
    if (!Number.isInteger(volunteering) || volunteering < 1 || volunteering > 15) {
        errors.push('Volunteers needed must be between 1 and 15.');
    }

    if (errors.length > 0) {
        return res.status(400).json({ success: false, errors});
    }

    try {
        const result = await pool.query(
            `INSERT INTO job
            (poster_id, title, description, category, job_location, task_date, task_time, volunteers_needed, image_location)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id, title, description, category, job_location, task_date, task_time, volunteers_needed, image_location, status, created_at`, 
            [req.user.id, title.trim(), description.trim(), category, address || null, date || null, time || null, volunteering, image_location || null]
        );

        res.status(201).json( {success: true, task: result.rows[0]});

    } catch (err) {
        console.error(err);
        res.status(500).json({ success:false, message: 'Server error'});
    }
});

app.get('/tasks', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT j.id, j.poster_id, j.title, j.description, j.category, j.job_location, 
            j.task_date, j.task_time, j.volunteers_needed, j.status, j.urgent_flag, j.image_location, j.created_at,
            (jc.id IS NOT NULL) AS claimed
            FROM job j
            LEFT JOIN job_claim jc ON jc.job_id = j.id AND jc.user_id = $1
            WHERE j.status <> 'Done'
            ORDER BY j.created_at DESC`,
            [req.user.id]
        );

        res.json({ success: true, tasks: result.rows })

    }catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error'})
    } 
});

app.post('/tasks/:id/claim', authenticateToken, async (req, res) => {
    const jobId = parseInt(req.params.id, 10);

    if (!Number.isInteger(jobId)) {
        return res.status(400).json({ success: false, message: 'Invalid task id.'});
    }

    try {
        const job = await pool.query('SELECT id, poster_id FROM job WHERE id = $1',
            [jobId]);
        // check if it exist
        if (job.rows[0].length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found'})
        }
        // stop voluneering your own task
        if (job.rows[0].poster_id === req.user.id) {
            return res.status(400).json({ success: false, message: "You can't volunteer for your own task."});
        }
        // record the claim
        await pool.query(
            `INSERT INTO job_claim (job_id, user_id, status)
            VALUES ($1, $2, 'Claimed')`,
            [jobId, req.user.id]
        );

        res.status(201).json({ success: true, message: 'Added to your active tasks'});

    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ success: false, message: 'You have already volunteered for this task.'});
        }
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error'});
    }
})

app.delete('/tasks/:id/claim', authenticateToken, async (req, res) => {
    const jobId = parseInt(req.params.id, 10);
    if(!Number.isInteger(jobId)) {
        return res.status(400).json({ success: false, message: 'Invalid task id'})
    }

    try {
        const result = await pool.query(
            `DELETE FROM job_claim
            WHERE job_id = $1 AND user_id = $2 AND status = 'Claimed'
            RETURNING id`,
            [jobId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'You have not volunteeered for this task'})
        }

        res.json({ success: true, message: 'Remove from your active tasks'});
    }catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error'})
    }
});

app.post('/tasks/:id/complete', authenticateToken, async (req, res) => {
    const jobId = parseInt(req.params.id, 10);
    if (!Number.isInteger(jobId)) {
        return res.status(400).json( {success: false, message: 'Invalid task id'})
        }

    const client = await pool.connect();    
    try {
        const job = await client.query('SELECT poster_id FROM job WHERE id = $1', [jobId])
        if (job.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Task not found'})
        }
        if (job.rows[0].poster_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only complete your own tasks'})
        }

        await client.query(
            `UPDATE job_claim SET status = 'Completed' 
            Where job_id = $1
            AND status = 'Claimed'`,
            [jobId]
        );

        res.json({ success: true, message: 'Task marked complete'});

        }catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error'})
        }finally {
        client.release();
        }
});