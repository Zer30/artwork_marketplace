const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = new Pool();

exports.register = async (req, res) => {
    const { username, email, password } = req.body;

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
        const insertUserQuery = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)';
        await pool.query(insertUserQuery, [username, email, hashedPassword]);

        res.json({ success: true });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
    }
};

exports.login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Check if user exists
        const userCheckQuery = 'SELECT * FROM users WHERE username = $1';
        const userCheckResult = await pool.query(userCheckQuery, [username]);

        if (userCheckResult.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid username or password' });
        }

        const user = userCheckResult.rows[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid username or password' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
    }
};