import { query, execute } from '../_lib/db.js';
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
        const body = req.body || {};
        const {
            studentId, firstName, lastName, password, gender, dob, phone, religion, status,
            batch_year, id_card_image, email
        } = body;

        // Validate required fields
        if (!studentId || !firstName || !lastName || !password || !gender) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if user already exists
        const existing = await query('SELECT id FROM users WHERE student_id = ?', [studentId]);
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Student ID already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        const result = await execute(`
      INSERT INTO users (student_id, first_name, last_name, email, phone, password, gender, dob, religion, status, batch_year, id_card_image, verification_status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [studentId, firstName, lastName, email || '', phone || '', hashedPassword, gender, dob || null, religion || '', status || '', batch_year || '', id_card_image || '']);

        if (result.insertId) {
            // Create empty profile
            await execute('INSERT INTO profiles (user_id, biodata_status) VALUES (?, ?)', [result.insertId, 'pending']);

            res.status(201).json({
                success: true,
                message: 'Registration successful! Your account is pending verification.',
                userId: result.insertId
            });
        } else {
            res.status(500).json({ success: false, message: 'Failed to create user' });
        }

    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}
