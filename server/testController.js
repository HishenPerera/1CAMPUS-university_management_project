require('dotenv').config();
const pool = require('./src/config/db');
const { getSystemInsights } = require('./src/controllers/webAdminController');

async function test() {
    try {
        const req = {};
        const res = {
            json: (data) => console.log(JSON.stringify(data, null, 2)),
            status: (code) => {
                console.log("Status:", code);
                return { json: (data) => console.log(data) };
            }
        };
        await getSystemInsights(req, res);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}
test();
