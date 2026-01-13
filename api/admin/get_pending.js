import { query } from '../_lib/db.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const users = await query(`
      SELECT student_id, first_name, last_name, status, batch_year, id_card_image 
      FROM users 
      WHERE verification_status = 'pending'
      ORDER BY created_at DESC
    `);

        res.status(200).json(users);

    } catch (error) {
        console.error('Get pending error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}
