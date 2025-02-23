const { Pool } = require("pg");

// Database configuration
const pool = new Pool({
    user: "neondb_owner",  // Your PostgreSQL username
    host: "ep-weathered-hat-a1csxlry-pooler.ap-southeast-1.aws.neon.tech", // Database server (use the IP if remote)
    database: "neondb", // Your database name
    password: "npg_vrI8u5CVyswc", // Your PostgreSQL password
    port: 5432, // Default PostgreSQL port
    ssl: {
        rejectUnauthorized: false 
    }// Accepts self-signed certificates
});

pool.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch(err => console.error("Connection error", err));

module.exports = pool;


// postgresql://artwork_marketplace_owner:npg_UIKDM3AE9RpL@ep-winter-butterfly-a1y6q9i7-pooler.ap-southeast-1.aws.neon.tech/
// // artwork_marketplace?sslmode=require