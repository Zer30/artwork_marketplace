const express = require('express');
const router = express.Router();
const artworkController = require('../controllers/artworkController');
const cloudinary = require('../config/cloudinary');
const pool = require('../db');
const authenticateToken = require('../middleware/authMiddleware'); // Updated path

// Get all artworks
router.get('/', artworkController.getAllArtworks);

// Get artwork by ID
router.get('/:id', artworkController.getArtworkById);

// Create new artwork
router.post('/', artworkController.createArtwork);

// Update artwork
router.put('/:id', artworkController.updateArtwork);

// Delete artwork
router.delete('/:id', artworkController.deleteArtwork);

router.post('/upload', authenticateToken, async (req, res) => {
    try {
        console.log('Received upload request'); // Debug log
        
        const { title, description, price, category, imageData } = req.body;
        const sellerId = req.user.userId;

        // Validate input
        if (!title || !description || !price || !imageData) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        // Convert base64 to buffer for Cloudinary
        const imageBuffer = Buffer.from(imageData, 'base64');

        // Upload to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload_stream({
            folder: 'artworks',
            resource_type: 'image'
        }, async (error, result) => {
            if (error) {
                console.error('Cloudinary error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Image upload failed'
                });
            }

            try {
                // Save to database
                const query = `
                    INSERT INTO artworks (
                        title, 
                        description, 
                        price, 
                        category,
                        image_url, 
                        cloudinary_id, 
                        seller_id
                    ) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7) 
                    RETURNING *
                `;

                const values = [
                    title,
                    description,
                    price,
                    category,
                    result.secure_url,
                    result.public_id,
                    sellerId
                ];

                const dbResult = await pool.query(query, values);
                
                res.status(201).json({
                    success: true,
                    artwork: dbResult.rows[0]
                });
            } catch (dbError) {
                console.error('Database error:', dbError);
                res.status(500).json({
                    success: false,
                    message: 'Error saving artwork details'
                });
            }
        }).end(imageBuffer);

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'An error occurred while uploading the artwork'
        });
    }
});

// Get seller's artworks
router.get('/seller', authenticateToken, async (req, res) => {
    try {
        const sellerId = req.user.userId;
        
        const query = `
            SELECT * FROM artworks 
            WHERE seller_id = $1 
            ORDER BY created_at DESC
        `;
        
        const result = await pool.query(query, [sellerId]);
        
        res.json({
            success: true,
            artworks: result.rows
        });
    } catch (error) {
        console.error('Error fetching artworks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching artworks'
        });
    }
});

module.exports = router;