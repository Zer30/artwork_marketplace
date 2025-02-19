require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authenticateToken = require('./authMiddleware');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const pool = require('./db'); 

const app = express();
// const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

// Ensure the uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Serve static files from the uploads directory
app.use('/uploads', express.static(uploadsDir));

// Database connection
// const pool = new Pool({
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT,
// });

// Middleware
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Welcome to the API! Use /login or /register.");
});

// Routes
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const userCheckQuery = 'SELECT * FROM users WHERE email = $1';
        const userCheckResult = await pool.query(userCheckQuery, [email]);

        if (userCheckResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        const user = userCheckResult.rows[0];

        // Log the user object to verify accounttype
        console.log('User:', user);

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user.id }, process.env.SECRET_KEY, { expiresIn: '1h' });

        // Log the user object to verify accounttype
        console.log('User after password check:', user);

        res.json({ success: true, token, accountType: user.accounttype }); // Include account type in the response
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
    }
});

app.post("/register", async (req, res) => {
    const { username, email, password, address, telephone, accountType } = req.body;

    console.log("Received registration data:", req.body);

    try {
        // Check if email or username already exists
        const emailCheckQuery = 'SELECT * FROM users WHERE email = $1 OR username = $2';
        const emailCheckResult = await pool.query(emailCheckQuery, [email, username]);

        if (emailCheckResult.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'Email or username already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const insertUserQuery = 'INSERT INTO users (username, email, password, address, telephone, accounttype) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const insertUserResult = await pool.query(insertUserQuery, [username, email, hashedPassword, address, telephone, accountType]);

        console.log("Inserted user data:", insertUserResult.rows[0]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
    }
});

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// Endpoint for file uploads
app.post('/upload', upload.single('file'), async (req, res) => {
    const { title, description, category, price } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).send({ error: "File upload failed." });
    }

    const filePath = `/uploads/${file.filename}`;

    try {
        const result = await pool.query(
            "INSERT INTO artworks (title, description, category, price, file_path) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [title, description, category, price, filePath]
        );

        res.status(201).json({ message: "Upload successful", artwork: result.rows[0] });
    } catch (error) {
        console.error("Error uploading artwork:", error);
        res.status(500).json({ error: "Server error" });
    }
});

// Fetch artworks by category
app.get("/artworks/:category", async (req, res) => {
    const { category } = req.params;
    try {
        const result = await pool.query("SELECT * FROM artworks WHERE category = $1", [category]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Fetch user information
app.get('/api/user/info', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT name, address, telephone, email, profileImage FROM users WHERE id = $1', [req.user.userId]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching user information:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update user information
app.post('/api/user/update', authenticateToken, async (req, res) => {
    const { name, address, telephone, email } = req.body;
    try {
        await pool.query('UPDATE users SET name = $1, address = $2, telephone = $3, email = $4 WHERE id = $5', [name, address, telephone, email, req.user.userId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating user information:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// Upload profile image
app.post('/api/user/upload-profile-image', authenticateToken, upload.single('profileImage'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.status(400).send({ error: "File upload failed." });
    }

    const filePath = `/uploads/${file.filename}`;

    try {
        await pool.query('UPDATE users SET profileImage = $1 WHERE id = $2', [filePath, req.user.userId]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error uploading profile image:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Fetch user wishlist
app.get('/api/user/wishlist', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT title FROM wishlist WHERE user_id = $1', [req.user.userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fetch user bought artworks
app.get('/api/user/bought-artworks', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT title FROM bought_artworks WHERE user_id = $1', [req.user.userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching bought artworks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Fetch user artworks
app.get('/api/user/artworks', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT title FROM artworks WHERE user_id = $1', [req.user.userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching artworks:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Start the server
const ip = process.env.IP || 'localhost';
const port = process.env.PORT || 5000;
app.listen(ip,port, () => {
    console.log(`Server running on port ${port}`);
});