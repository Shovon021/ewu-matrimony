import { execute } from '../_lib/db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    try {
        const { student_id, action } = req.body || {};

        if (!student_id || !action) {
            return res.status(400).json({ success: false, message: 'Student ID and action required' });
        }

        const newStatus = action === 'approve' ? 'verified' : 'rejected';

        const result = await execute(
            'UPDATE users SET verification_status = ? WHERE student_id = ?',
            [newStatus, student_id]
        );

        if (result.affectedRows > 0) {
            res.status(200).json({ success: true, message: `User ${newStatus} successfully` });
        } else {
            res.status(404).json({ success: false, message: 'User not found' });
        }

    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
