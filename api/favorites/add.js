import { execute, query } from '../_lib/db.js';

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
        const { user_id, target_id } = req.body || {};

        if (!user_id || !target_id) {
            return res.status(400).json({ success: false, message: 'User ID and target ID required' });
        }

        // Check if already favorited
        const existing = await query(
            'SELECT id FROM favorites WHERE user_id = ? AND target_id = ?',
            [user_id, target_id]
        );

        if (existing.length > 0) {
            // Remove favorite
            await execute('DELETE FROM favorites WHERE user_id = ? AND target_id = ?', [user_id, target_id]);
            return res.status(200).json({ success: true, message: 'Removed from favorites', favorited: false });
        } else {
            // Add favorite
            await execute('INSERT INTO favorites (user_id, target_id, created_at) VALUES (?, ?, NOW())', [user_id, target_id]);
            return res.status(200).json({ success: true, message: 'Added to favorites', favorited: true });
        }

    } catch (error) {
        console.error('Favorites add error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
