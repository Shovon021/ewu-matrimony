import { query } from '../_lib/db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ success: false, message: 'User ID required' });
    }

    try {
        const matches = await query(`
      SELECT 
        u.id, u.student_id, u.first_name, u.last_name, u.gender,
        p.photo, p.occupation
      FROM interests i
      INNER JOIN users u ON (
        (i.sender_id = ? AND i.receiver_id = u.id) OR
        (i.receiver_id = ? AND i.sender_id = u.id)
      )
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE i.status = 'matched'
      GROUP BY u.id
    `, [user_id, user_id]);

        res.status(200).json({ success: true, data: matches });

    } catch (error) {
        console.error('My matches error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
