const cron = require('node-cron');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const backupDatabase = () => {
    return new Promise((resolve, reject) => {
        const backupDir = path.join(__dirname, 'backups');
        if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

        const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
        const filePath = path.join(backupDir, fileName);

        const user = process.env.DB_USER || 'postgres';
        const pass = process.env.DB_PASSWORD || '';
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || 5432;
        const db = process.env.DB_NAME || 'neondb';

        const connectionString = `postgresql://${user}:${pass}@${host}:${port}/${db}`;
        const cmd = `pg_dump "${connectionString}" > "${filePath}"`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Backup Error: ${error.message}`);
                return reject(error);
            }
            console.log(`Backup successful: ${fileName}`);
            resolve(fileName);
        });
    });
};

// Scheduled for every day at midnight (00:00)
cron.schedule('0 0 * * *', () => {
    console.log('Running daily backup...');
    backupDatabase().catch(console.error);
});

module.exports = { backupDatabase };