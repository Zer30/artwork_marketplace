const pool = require('../db');

// Get all artworks
exports.getAllArtworks = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM artworks');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get artwork by ID
exports.getArtworkById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM artworks WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Artwork not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create new artwork
exports.createArtwork = async (req, res) => {
    const { title, description, price, artist } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO artworks (title, description, price, artist) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description, price, artist]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update artwork
exports.updateArtwork = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, artist } = req.body;
    try {
        const result = await pool.query(
            'UPDATE artworks SET title = $1, description = $2, price = $3, artist = $4 WHERE id = $5 RETURNING *',
            [title, description, price, artist, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Artwork not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete artwork
exports.deleteArtwork = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM artworks WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Artwork not found' });
        }
        res.json({ message: 'Artwork deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};