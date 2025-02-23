const pool = require('../db');

const User = {
    getAll: async () => {
        const result = await pool.query('SELECT * FROM users');
        return result.rows;
    },

    getById: async (id) => {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        return result.rows[0];
    },

    getByUsername: async (username) => {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        return result.rows[0];
    },

    create: async (username, email, password) => {
        const result = await pool.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
            [username, email, password]
        );
        return result.rows[0];
    },

    update: async (id, username, email, password) => {
        const result = await pool.query(
            'UPDATE users SET username = $1, email = $2, password = COALESCE($3, password) WHERE id = $4 RETURNING *',
            [username, email, password, id]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};

module.exports = User;