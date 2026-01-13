import { query, execute } from './_lib/db.js';

// Consolidated Chat API - handles send and get via ?action= parameter
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
            case 'send':
                return handleSend(req, res);
            case 'get':
                return handleGet(req, res);
            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Chat API error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}

// ========== SEND MESSAGE ==========
async function handleSend(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { sender_id, receiver_id, message } = req.body || {};

    if (!sender_id || !receiver_id || !message) {
        return res.status(400).json({ success: false, message: 'Sender ID, receiver ID, and message required' });
    }

    await execute(
        'INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (?, ?, ?, NOW())',
        [sender_id, receiver_id, message]
    );

    return res.status(200).json({ success: true, message: 'Message sent' });
}

// ========== GET MESSAGES ==========
async function handleGet(req, res) {
    const { user_id, partner_id } = req.query;

    if (!user_id || !partner_id) {
        return res.status(400).json({ success: false, message: 'User ID and partner ID required' });
    }

    const messages = await query(`
        SELECT m.*, 
            s.first_name as sender_name,
            r.first_name as receiver_name
        FROM messages m
        LEFT JOIN users s ON m.sender_id = s.id
        LEFT JOIN users r ON m.receiver_id = r.id
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
    `, [user_id, partner_id, partner_id, user_id]);

    return res.status(200).json({ success: true, data: messages });
}
