import { execute, query } from '../_lib/db.js';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
        const {
            user_id,
            height, weight, complexion, occupation, education, location, bio,
            father_name, mother_name, siblings_info, family_type, family_values,
            photo_base64 // Base64 encoded image if uploading
        } = req.body || {};

        if (!user_id) {
            return res.status(400).json({ success: false, message: 'User ID required' });
        }

        let photoUrl = null;

        // Handle photo upload to Cloudinary
        if (photo_base64) {
            try {
                const uploadResult = await cloudinary.uploader.upload(photo_base64, {
                    folder: 'ewu-matrimony/profiles',
                    resource_type: 'image'
                });
                photoUrl = uploadResult.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                // Continue without photo if upload fails
            }
        }

        // Check if profile exists
        const existing = await query('SELECT id FROM profiles WHERE user_id = ?', [user_id]);

        if (existing.length > 0) {
            // Update existing profile
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
            // Insert new profile
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

        res.status(200).json({
            success: true,
            message: 'Profile saved successfully',
            photo_url: photoUrl
        });

    } catch (error) {
        console.error('Save profile error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}
