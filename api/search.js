import { query } from './_lib/db.js';

// Search API - handles verified profile search
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { gender, religion, min_age, max_age, status } = req.query;

    try {
        let sql = `
            SELECT 
                u.id, u.student_id, u.first_name, u.last_name, u.gender, u.dob, u.religion, u.batch_year, u.status,
                p.height, p.occupation, p.education, p.location, p.photo
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.verification_status = 'verified'
        `;
        const params = [];

        if (gender) {
            sql += ' AND u.gender = ?';
            params.push(gender);
        }
        if (religion) {
            sql += ' AND u.religion = ?';
            params.push(religion);
        }
        if (status) {
            sql += ' AND u.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY u.created_at DESC LIMIT 50';

        const users = await query(sql, params);
        return res.status(200).json({ success: true, data: users });

    } catch (error) {
        console.error('Search error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
