import mysql from 'mysql2/promise';

// TiDB Cloud connection with SSL
export async function getConnection() {
    const hostRaw = process.env.DB_HOST || 'localhost:3306';
    let host, port;

    if (hostRaw.includes(':')) {
        [host, port] = hostRaw.split(':');
        port = parseInt(port, 10);
    } else {
        host = hostRaw;
        port = 3306;
    }

    const connection = await mysql.createConnection({
        host,
        port,
        user: process.env.DB_USER || '3EfCaKwRxefFq4w.root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'ewu_matrimony',
        ssl: {
            rejectUnauthorized: true
        }
    });

    return connection;
}

// Helper to run a query and close connection
export async function query(sql, params = []) {
    const conn = await getConnection();
    try {
        const [rows] = await conn.execute(sql, params);
        return rows;
    } finally {
        await conn.end();
    }
}

// Helper to run insert/update and return result
export async function execute(sql, params = []) {
    const conn = await getConnection();
    try {
        const [result] = await conn.execute(sql, params);
        return result;
    } finally {
        await conn.end();
    }
}
