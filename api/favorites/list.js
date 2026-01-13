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
        const favorites = await query(`
      SELECT u.id, u.student_id, u.first_name, u.last_name, u.gender, p.photo, p.occupation
      FROM favorites f
      INNER JOIN users u ON f.target_id = u.id
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [user_id]);

        res.status(200).json({ success: true, data: favorites });

    } catch (error) {
        console.error('Favorites list error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
