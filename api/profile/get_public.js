import { query } from '../_lib/db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { student_id } = req.query;

    if (!student_id) {
        return res.status(400).json({ success: false, message: 'Student ID required' });
    }

    try {
        const users = await query(`
      SELECT 
        u.student_id, u.first_name, u.last_name, u.gender, u.dob, u.religion, u.batch_year, u.status,
        p.height, p.weight, p.complexion, p.occupation, p.education, p.location, p.bio, p.photo,
        p.father_name, p.mother_name, p.siblings_info, p.family_type, p.family_values
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.student_id = ? AND u.verification_status = 'verified'
    `, [student_id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Profile not found or not verified' });
        }

        res.status(200).json({ success: true, data: users[0] });

    } catch (error) {
        console.error('Get public profile error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
