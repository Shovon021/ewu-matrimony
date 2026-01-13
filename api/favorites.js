import { query, execute } from './_lib/db.js';

// Consolidated Favorites API - handles add and list via ?action= parameter
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const action = req.query.action || 'list';

    try {
        switch (action) {
            case 'add':
                return handleAdd(req, res);
            case 'list':
                return handleList(req, res);
            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Favorites API error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}

// ========== ADD/REMOVE FAVORITE ==========
async function handleAdd(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { user_id, target_id } = req.body || {};

    if (!user_id || !target_id) {
        return res.status(400).json({ success: false, message: 'User ID and target ID required' });
    }

    const existing = await query(
        'SELECT id FROM favorites WHERE user_id = ? AND target_id = ?',
        [user_id, target_id]
    );

    if (existing.length > 0) {
        await execute('DELETE FROM favorites WHERE user_id = ? AND target_id = ?', [user_id, target_id]);
        return res.status(200).json({ success: true, message: 'Removed from favorites', favorited: false });
    } else {
        await execute('INSERT INTO favorites (user_id, target_id, created_at) VALUES (?, ?, NOW())', [user_id, target_id]);
        return res.status(200).json({ success: true, message: 'Added to favorites', favorited: true });
    }
}

// ========== LIST FAVORITES ==========
async function handleList(req, res) {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ success: false, message: 'User ID required' });
    }

    const favorites = await query(`
        SELECT u.id, u.student_id, u.first_name, u.last_name, u.gender, p.photo, p.occupation
        FROM favorites f
        INNER JOIN users u ON f.target_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
    `, [user_id]);

    return res.status(200).json({ success: true, data: favorites });
}
