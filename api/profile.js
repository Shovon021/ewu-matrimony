
import { query, execute } from './_lib/db.js';
import { uploadImage } from './_lib/cloudinary.js';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { action } = req.query;

    try {
        if (req.method === 'GET') {
            // Check for GET action or default to getting profile
            return handleGetProfile(req, res);
        } else if (req.method === 'POST') {
            // We need to parse the body to check action if it's not in query
            // But formidable parses the body. So we rely on query param 'action' mostly.
            // Assume POST is save.
            return handleSaveProfile(req, res);
        } else {
            return res.status(405).json({ success: false, message: 'Method not allowed' });
        }
    } catch (e) {
        console.error('Profile API Error:', e);
        return res.status(500).json({ success: false, message: 'Server Error: ' + e.message });
    }
}

// ========== GET PROFILE ==========
async function handleGetProfile(req, res) {
    // We assume the user is logged in. But how do we know WHO is logged in?
    // In a real app we check session/token. 
    // The frontend sends user ID? NO.
    // The existing PHP implementation likely used session.
    // For this migration, we rely on the frontend sending the STUDENT ID or USER ID?
    // Checking edit_biodata.html... it calls api/profile/get.php without args!
    // This implies COOKIE based auth.
    // Vercel serverless doesn't share PHP sessions.

    // TEMPORARY FIX:
    // We need the frontend to send the Student ID (which is in localStorage 'user').
    // I will ask the user to update frontend to send student_id in query.

    const studentId = req.query.student_id;

    if (!studentId) {
        // If no ID provided, we can't do anything without session.
        return res.status(400).json({ success: false, message: 'Student ID required' });
    }

    const profiles = await query(`
        SELECT p.*, u.student_id, u.first_name, u.last_name, u.email
        FROM profiles p
        JOIN users u ON p.user_id = u.id
        WHERE u.student_id = ?
    `, [studentId]);

    if (profiles.length === 0) {
        // Maybe user exists but no profile?
        return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    return res.status(200).json({ success: true, data: profiles[0] });
}

// ========== SAVE PROFILE ==========
async function handleSaveProfile(req, res) {
    const form = formidable();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Form parse error' });
        }

        // Flatten fields (formidable sometimes returns arrays)
        const data = {};
        for (const key in fields) {
            data[key] = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
        }

        // We need student_id to identify the user
        const studentId = data.student_id; // Frontend must send this!
        if (!studentId) {
            return res.status(400).json({ success: false, message: 'Student ID required' });
        }

        // Handle Photo Upload
        let photoUrl = '';
        if (files.photo) {
            const file = Array.isArray(files.photo) ? files.photo[0] : files.photo;
            try {
                // Upload file.filepath to Cloudinary
                photoUrl = await uploadImage(file.filepath, 'ewu-matrimony/profiles');
            } catch (e) {
                console.error('Photo upload failed:', e);
            }
        }

        // Construct Update Query
        // We assume profile exists (created at registration). 
        // If not, we should check user first.

        try {
            // get user id
            const users = await query('SELECT id FROM users WHERE student_id = ?', [studentId]);
            if (users.length === 0) return res.status(404).json({ success: false, message: 'User not found' });
            const userId = users[0].id;

            // Prepare fields
            const updateFields = [
                'about_me', 'height', 'weight', 'skin_tone', 'blood_group', 'marital_status',
                'education', 'occupation', 'company', 'income',
                'present_address', 'permanent_address',
                'father_name', 'father_occupation', 'mother_name', 'mother_occupation',
                'siblings', 'family_type', 'family_status',
                'partner_min_age', 'partner_max_age', 'partner_min_height',
                'partner_religion', 'partner_education', 'partner_occupation',
                'preferred_location', 'expectations', 'biodata_status'
            ];

            const submitForVerification = data.submit_for_verification === '1';
            const status = submitForVerification ? 'pending' : 'draft';

            // Map incoming fields "father_profession" -> "father_occupation"
            data.father_occupation = data.father_profession;
            data.mother_occupation = data.mother_profession;
            data.family_status = data.family_class;
            data.partner_min_age = data.preferred_age_min;
            data.partner_max_age = data.preferred_age_max;
            data.partner_min_height = data.preferred_height;
            data.partner_religion = 'Islam'; // Default or add field?
            data.partner_education = data.preferred_education;
            data.partner_occupation = data.preferred_profession;
            data.biodata_status = status;

            let sql = 'UPDATE profiles SET ';
            const params = [];

            updateFields.forEach(field => {
                if (data[field] !== undefined) {
                    sql += `${field} = ?, `;
                    params.push(data[field]);
                }
            });

            if (photoUrl) {
                sql += 'photo = ?, ';
                params.push(photoUrl);
            }

            sql = sql.slice(0, -2); // remove last comma
            sql += ' WHERE user_id = ?';
            params.push(userId);

            await execute(sql, params);

            return res.status(200).json({ success: true, message: 'Profile updated successfully' });

        } catch (dbErr) {
            console.error('DB Error:', dbErr);
            return res.status(500).json({ success: false, message: 'Database error: ' + dbErr.message });
        }
    });
}
