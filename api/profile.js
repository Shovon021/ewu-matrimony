import { query, execute } from './_lib/db.js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Consolidated Profile API - handles get, get_public, save via ?action= parameter
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const action = req.query.action || 'get';

    try {
        switch (action) {
            case 'get':
                return handleGet(req, res);
            case 'get_public':
                return handleGetPublic(req, res);
            case 'save':
                return handleSave(req, res);
            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Profile API error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}

// ========== GET PROFILE ==========
async function handleGet(req, res) {
    const userId = req.query.user_id;
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID required' });
    }

    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password, ...safeUser } = users[0];
    return res.status(200).json({ success: true, user: safeUser });
}

// ========== GET PUBLIC PROFILE ==========
async function handleGetPublic(req, res) {
    const studentId = req.query.student_id;
    if (!studentId) {
        return res.status(400).json({ success: false, message: 'Student ID required' });
    }

    const users = await query(`
        SELECT u.id, u.student_id, u.first_name, u.last_name, u.gender, u.dob, u.religion,
               u.occupation, u.education, u.photo, u.bio, u.height, u.weight
        FROM users u
        WHERE u.student_id = ? AND u.verification_status = 'verified'
    `, [studentId]);

    if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    return res.status(200).json({ success: true, profile: users[0] });
}

// ========== SAVE PROFILE ==========
async function handleSave(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const {
        user_id,
        height, weight, complexion, occupation, education, location, bio,
        father_name, mother_name, siblings_info, family_type, family_values,
        photo_base64
    } = req.body || {};

    if (!user_id) {
        return res.status(400).json({ success: false, message: 'User ID required' });
    }

    let photoUrl = null;

    if (photo_base64) {
        try {
            const uploadResult = await cloudinary.uploader.upload(photo_base64, {
                folder: 'ewu-matrimony/profiles',
                resource_type: 'image'
            });
            photoUrl = uploadResult.secure_url;
        } catch (uploadError) {
            console.error('Cloudinary upload error:', uploadError);
        }
    }

    const existing = await query('SELECT id FROM profiles WHERE user_id = ?', [user_id]);

    if (existing.length > 0) {
        let updateSql = `
            UPDATE profiles SET 
                height = ?, weight = ?, complexion = ?, occupation = ?, education = ?, 
                location = ?, bio = ?, father_name = ?, mother_name = ?, siblings_info = ?,
                family_type = ?, family_values = ?, biodata_status = 'pending', updated_at = NOW()
        `;
        const params = [
            height || null, weight || null, complexion || '', occupation || '', education || '',
            location || '', bio || '', father_name || '', mother_name || '', siblings_info || '',
            family_type || '', family_values || ''
        ];

        if (photoUrl) {
            updateSql += ', photo = ?';
            params.push(photoUrl);
        }

        updateSql += ' WHERE user_id = ?';
        params.push(user_id);

        await execute(updateSql, params);
    } else {
        await execute(`
            INSERT INTO profiles (user_id, height, weight, complexion, occupation, education, location, bio, 
                father_name, mother_name, siblings_info, family_type, family_values, photo, biodata_status, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
        `, [
            user_id, height || null, weight || null, complexion || '', occupation || '', education || '',
            location || '', bio || '', father_name || '', mother_name || '', siblings_info || '',
            family_type || '', family_values || '', photoUrl || ''
        ]);
    }

    return res.status(200).json({
        success: true,
        message: 'Profile saved successfully',
        photo_url: photoUrl
    });
}
