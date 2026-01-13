import { query } from '../_lib/db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Get contact form submissions (stored in a messages or contacts table)
        // For now, return empty array since contact_submit doesn't store to DB yet
        const messages = await query(`
      SELECT m.*, 
        u.first_name, u.last_name, u.student_id
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      ORDER BY m.created_at DESC
      LIMIT 50
    `);

        res.status(200).json({ success: true, data: messages });

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, error: error.message, data: [] });
    }
}
