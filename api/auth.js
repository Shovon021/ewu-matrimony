import { query, execute } from './_lib/db.js';
import { uploadImage } from './_lib/cloudinary.js';
import bcrypt from 'bcryptjs';

// Consolidated Auth API - handles login and register via ?action= parameter
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const action = req.query.action || 'login';

    try {
        switch (action) {
            case 'login':
                return handleLogin(req, res);
            case 'register':
                return handleRegister(req, res);
            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Auth API error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}

// ========== LOGIN ==========
async function handleLogin(req, res) {
    const { student_id, studentId, password } = req.body || {};
    const id = student_id || studentId;

    if (!id || !password) {
        return res.status(400).json({ success: false, message: 'Student ID and password required' });
    }

    const users = await query('SELECT * FROM users WHERE student_id = ?', [id]);

    if (users.length === 0) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    if (user.verification_status !== 'verified') {
        return res.status(403).json({
            success: false,
            status: user.verification_status,
            message: 'Your account is pending verification. Please wait for admin approval.'
        });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { password: _, ...safeUser } = user;

    return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: safeUser
    });
}

// ========== REGISTER ==========
async function handleRegister(req, res) {
    const body = req.body || {};
    const {
        studentId, firstName, lastName, password, gender, dob, phone, religion, status,
        batch_year, id_card_image, email
    } = body;

    if (!studentId || !firstName || !lastName || !password || !gender) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const existing = await query('SELECT id FROM users WHERE student_id = ?', [studentId]);
    if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Student ID already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let idCardUrl = '';
    if (id_card_image && id_card_image.startsWith('data:image')) {
        try {
            idCardUrl = await uploadImage(id_card_image, 'ewu-matrimony/id-cards');
        } catch (e) {
            console.error('Failed to upload ID card:', e);
            return res.status(400).json({ success: false, message: 'Failed to upload photo. Image might be too large (Max 4MB).' });
        }
    }

    const result = await execute(`
        INSERT INTO users (student_id, first_name, last_name, email, phone, password, gender, dob, religion, status, batch_year, id_card_image, verification_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
    `, [studentId, firstName, lastName, email || '', phone || '', hashedPassword, gender, dob || null, religion || '', status || '', batch_year || '', idCardUrl]);

    if (result.insertId) {
        try {
            await execute('INSERT INTO profiles (user_id, biodata_status) VALUES (?, ?)', [result.insertId, 'draft']);
        } catch (e) {
            // profiles table might not exist
        }

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Your account is pending verification.',
            userId: result.insertId
        });
    } else {
        return res.status(500).json({ success: false, message: 'Failed to create user' });
    }
}
