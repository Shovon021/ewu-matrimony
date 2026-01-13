import { query } from '../_lib/db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { user_id, target_id } = req.query;

    if (!user_id || !target_id) {
        return res.status(400).json({ success: false, message: 'User ID and target ID required' });
    }

    try {
        const result = await query(
            'SELECT status FROM interests WHERE sender_id = ? AND receiver_id = ?',
            [user_id, target_id]
        );

        const reverseResult = await query(
            'SELECT status FROM interests WHERE sender_id = ? AND receiver_id = ?',
            [target_id, user_id]
        );

        const sentInterest = result.length > 0;
        const receivedInterest = reverseResult.length > 0;
        const matched = (result[0]?.status === 'matched') || (reverseResult[0]?.status === 'matched');

        res.status(200).json({
            success: true,
            sent_interest: sentInterest,
            received_interest: receivedInterest,
            matched: matched
        });

    } catch (error) {
        console.error('Check match error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
