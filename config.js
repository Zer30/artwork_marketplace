require('dotenv').config();
const net = require('net');

const express = require('express');
const app = express();

// Port availability checker
const findAvailablePort = async (startPort) => {
    const isPortAvailable = (port) => {
        return new Promise((resolve) => {
            const server = net.createServer()
                .once('error', () => resolve(false))
                .once('listening', () => {
                    server.once('close', () => resolve(true)).close();
                })
                .listen(port);
        });
    };

    let port = startPort;
    while (!(await isPortAvailable(port))) {
        port++;
    }
    return port;
};

// Default ports configuration
const DEFAULT_PORTS = {
    backend: 5000,
    frontend: 3000,
    database: 5432
};

// Initialize configuration
const initializeConfig = async () => {
    const backendPort = await findAvailablePort(DEFAULT_PORTS.backend);
    const frontendPort = await findAvailablePort(DEFAULT_PORTS.frontend);

    const API_CONFIG = {
        BASE_URL: process.env.NODE_ENV === 'production'
            ? 'https://artwork-marketplace.onrender.com/api'
            : `http://localhost:${backendPort}/api`,
    };

    const config = {
        server: {
            port: backendPort,
            env: process.env.NODE_ENV || 'development'
        },
        database: {
            url: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production'
        },
        cloudinary: {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        },
        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: '24h'
        },
        cors: {
            origin: process.env.FRONTEND_URL || `http://localhost:${frontendPort}`,
            credentials: true
        }
    };

    app.listen(backendPort, () => {
        console.log(`Server running on port ${backendPort}`);
    });

    return { config, API_CONFIG };
};

// Export an async initialization function
module.exports = initializeConfig;