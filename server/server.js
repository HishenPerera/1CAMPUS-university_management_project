require("dotenv").config();
const http = require("http");
const pool = require("./src/config/db");
const app = require("./src/app");

const PORT = process.env.PORT || 5001;

// Create HTTP server around Express
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});