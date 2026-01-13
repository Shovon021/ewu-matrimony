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
        const { sender_id, receiver_id } = req.body || {};

        if (!sender_id || !receiver_id) {
            return res.status(400).json({ success: false, message: 'Sender ID and receiver ID required' });
        }

        // Check if interest already exists
        const existing = await query(
            'SELECT id FROM interests WHERE sender_id = ? AND receiver_id = ?',
            [sender_id, receiver_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'Interest already sent' });
        }

        // Check if reverse interest exists (mutual match!)
        const reverse = await query(
            'SELECT id FROM interests WHERE sender_id = ? AND receiver_id = ?',
            [receiver_id, sender_id]
        );

        const status = reverse.length > 0 ? 'matched' : 'pending';

        // Create interest
        await execute(
            'INSERT INTO interests (sender_id, receiver_id, status, created_at) VALUES (?, ?, ?, NOW())',
            [sender_id, receiver_id, status]
        );

        // If matched, update the original interest too
        if (status === 'matched') {
            await execute(
                'UPDATE interests SET status = ? WHERE sender_id = ? AND receiver_id = ?',
                ['matched', receiver_id, sender_id]
            );
        }

        res.status(200).json({
            success: true,
            message: status === 'matched' ? 'It\'s a match!' : 'Interest sent successfully',
            matched: status === 'matched'
        });

    } catch (error) {
        console.error('Send interest error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
