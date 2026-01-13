
import { createConnection } from 'mysql2/promise';

export default async function handler(req, res) {
    let host = process.env.DB_HOST;
    let port = 4000;

    if (host.includes(':')) {
        [host, port] = host.split(':');
        port = parseInt(port, 10);
    }

    const config = {
        host: host,
        port: port,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: true }
    };

    let steps = [];
    steps.push({ step: 'Config Check', config: { ...config, password: '***' } });

    try {
        const conn = await createConnection(config);
        steps.push({ step: 'Connection', status: 'Success' });

        const [tables] = await conn.execute('SHOW TABLES');
        steps.push({ step: 'List Tables', tables: tables });

        try {
            const [users] = await conn.execute('SELECT count(*) as count FROM users');
            steps.push({ step: 'Count Users', count: users[0].count });
        } catch (err) {
            steps.push({ step: 'Count Users', error: err.message });
        }

        await conn.end();
        res.status(200).json({ success: true, report: steps });
    } catch (error) {
        steps.push({ step: 'Connection', error: error.message, code: error.code });
        res.status(500).json({ success: false, report: steps });
    }
}
