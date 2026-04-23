require('dotenv').config();
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 5001;
const BASE_URL = `http://localhost:${PORT}/api/webadmin`;

// Generate a valid JWT token for a simulated web_admin user
const generateAdminToken = () => {
    const payload = {
        id: 1, // Simulated admin user ID
        email: 'test_admin@example.com',
        role: 'web_admin',
        is_temp_password: false
    };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const runTests = async () => {
    console.log("Starting Web Admin Endpoint Tests...\n");
    const token = generateAdminToken();
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    const endpointsToTest = [
        { name: 'System Insights', url: '/system-insights', method: 'GET' },
        { name: 'List DB Tables', url: '/db/tables', method: 'GET' },
        { name: 'Get Audit Logs', url: '/logs', method: 'GET' },
        { name: 'Get Web Admins', url: '/admins', method: 'GET' },
        { name: 'Get Staff List', url: '/staff', method: 'GET' },
        { name: 'Get Temp Passwords', url: '/temp-passwords', method: 'GET' },
        { name: 'Get Database Backups', url: '/backups', method: 'GET' },
        { name: 'Get Users Table Data', url: '/db/tables/users?limit=5', method: 'GET' }
    ];

    let passed = 0;

    for (const endpoint of endpointsToTest) {
        try {
            console.log(`Testing [${endpoint.method}] ${endpoint.name} (${endpoint.url})...`);
            const response = await fetch(`${BASE_URL}${endpoint.url}`, {
                method: endpoint.method,
                headers
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`HTTP Error: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            
            // Just printing out a snippet of the data to verify it works without spamming console
            let preview = JSON.stringify(data).substring(0, 100);
            if (JSON.stringify(data).length > 100) preview += "...";

            console.log(`✅ Success! Response Preview: ${preview}\n`);
            passed++;
        } catch (error) {
            console.error(`❌ Failed: ${error.message}\n`);
        }
    }

    console.log(`\nTest Summary: ${passed}/${endpointsToTest.length} passed.`);
};

runTests();
