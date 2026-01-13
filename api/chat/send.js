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
        const { sender_id, receiver_id, message } = req.body || {};

        if (!sender_id || !receiver_id || !message) {
            return res.status(400).json({ success: false, message: 'Sender ID, receiver ID, and message required' });
        }

        await execute(
            'INSERT INTO messages (sender_id, receiver_id, message, created_at) VALUES (?, ?, ?, NOW())',
            [sender_id, receiver_id, message]
        );

        res.status(200).json({ success: true, message: 'Message sent' });

    } catch (error) {
        console.error('Send chat error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
