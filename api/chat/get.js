import { query } from '../_lib/db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { user_id, partner_id } = req.query;

    if (!user_id || !partner_id) {
        return res.status(400).json({ success: false, message: 'User ID and partner ID required' });
    }

    try {
        const messages = await query(`
      SELECT m.*, 
        s.first_name as sender_name,
        r.first_name as receiver_name
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [user_id, partner_id, partner_id, user_id]);

        res.status(200).json({ success: true, data: messages });

    } catch (error) {
        console.error('Get chat error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
