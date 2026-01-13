import { query } from '../_lib/db.js';
import bcrypt from 'bcryptjs';

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
        const { student_id, password } = req.body || {};

        if (!student_id || !password) {
            return res.status(400).json({ success: false, message: 'Student ID and password required' });
        }

        // Find user
        const users = await query('SELECT * FROM users WHERE student_id = ?', [student_id]);

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const user = users[0];

        // Check verification status
        if (user.verification_status !== 'verified') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending verification. Please wait for admin approval.'
            });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Return user data (without password)
        const { password: _, ...safeUser } = user;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: safeUser
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}
