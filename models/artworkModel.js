const pool = require('../db');

const Artwork = {
    getAll: async () => {
        const result = await pool.query('SELECT * FROM artworks');
        return result.rows;
    },

    getById: async (id) => {
        const result = await pool.query('SELECT * FROM artworks WHERE id = $1', [id]);
        return result.rows[0];
    },

    create: async (title, description, price, artist) => {
        const result = await pool.query(
            'INSERT INTO artworks (title, description, price, artist) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description, price, artist]
        );
        return result.rows[0];
    },

    update: async (id, title, description, price, artist) => {
        const result = await pool.query(
            'UPDATE artworks SET title = $1, description = $2, price = $3, artist = $4 WHERE id = $5 RETURNING *',
            [title, description, price, artist, id]
        );
        return result.rows[0];
    },

    delete: async (id) => {
        const result = await pool.query('DELETE FROM artworks WHERE id = $1 RETURNING *', [id]);
        return result.rows[0];
    }
};

module.exports = Artwork;