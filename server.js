require('dotenv').config();
const initializeConfig = require('./config');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const authRoutes = require('./routes/authRoutes');
const artworkRoutes = require('./routes/artworkRoutes');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();
const DEFAULT_PORT = 5000;

const startServer = async () => {
    try {
        const { config, API_CONFIG } = await initializeConfig();

        // Find available port
        const getAvailablePort = async (startPort) => {
            const net = require('net');
            const server = net.createServer();
            
            return new Promise((resolve, reject) => {
                let port = startPort;
                
                const tryPort = () => {
                    server.once('error', (err) => {
                        if (err.code === 'EADDRINUSE') {
                            port++;
                            tryPort();
                        } else {
                            reject(err);
                        }
                    });
                    
                    server.once('listening', () => {
                        server.close(() => resolve(port));
                    });
                    
                    server.listen(port);
                };
                
                tryPort();
            });
        };

        const port = await getAvailablePort(DEFAULT_PORT);

        // Middleware
        app.use(cors(config.cors));
        app.use(bodyParser.json({ limit: '50mb' }));
        app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        // Static files
        app.use('/uploads', express.static(uploadsDir));

        // Logging middleware
        app.use((req, res, next) => {
            console.log(`${req.method} ${req.url}`);
            next();
        });

        // Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/artworks', artworkRoutes);
        app.use('/api/users', userRoutes);

        // Root route
        app.get("/", (req, res) => {
            res.json({ message: "API is running" });
        });

        // Error handling middleware
        app.use(errorHandler);

        const server = app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            console.log(`Frontend URL: ${config.cors.origin}`);
            console.log(`API Base URL: ${API_CONFIG.BASE_URL}`);
        });

        return server;
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer().catch(error => {
        console.error('Failed to start server:', error);
        process.exit(1);
    });
}

module.exports = app;