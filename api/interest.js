import { query, execute } from './_lib/db.js';

// Consolidated Interest API - handles send, my_matches, check_match via ?action= parameter
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const action = req.query.action || 'my_matches';

    try {
        switch (action) {
            case 'send':
                return handleSend(req, res);
            case 'my_matches':
                return handleMyMatches(req, res);
            case 'check_match':
                return handleCheckMatch(req, res);
            case 'get_notifications':
                return handleGetNotifications(req, res);
            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Interest API error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}

// ... existing handlers ...

// ========== GET NOTIFICATIONS ==========
async function handleGetNotifications(req, res) {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ success: false, message: 'User ID required' });
    }

    try {
        // Get pending PROPOSALS received
        const pending = await query(`
            SELECT 
                i.id, i.created_at, 'request' as type,
                u.first_name, u.last_name
            FROM interests i
            JOIN users u ON i.sender_id = u.id
            WHERE i.receiver_id = ? AND i.status = 'pending'
            ORDER BY i.created_at DESC
        `, [user_id]);

        // Get new MATCHES (where user is sender OR receiver)
        // For simplicity, we just show all matches as "You have a match!"
        // In a real app, we'd have an 'is_read' flag.
        const matches = await query(`
            SELECT 
                i.id, i.created_at, 'match' as type,
                u.first_name, u.last_name
            FROM interests i
            JOIN users u ON (i.sender_id = u.id OR i.receiver_id = u.id)
            WHERE (i.receiver_id = ? OR i.sender_id = ?) 
              AND i.status = 'matched' 
              AND u.id != ? -- Exclude self
            ORDER BY i.created_at DESC
            LIMIT 5
        `, [user_id, user_id, user_id]);

        const notifications = [...pending, ...matches].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return res.status(200).json({
            success: true,
            count: pending.length, // Only count pending requests as "unread" for now to avoid annoyance
            notifications
        });
    } catch (e) {
        console.error('Get notifications error:', e);
        return res.status(500).json({ success: false, message: 'Database error' });
    }
}

// ========== SEND INTEREST ==========
async function handleSend(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { sender_id, receiver_id } = req.body || {};

    if (!sender_id || !receiver_id) {
        return res.status(400).json({ success: false, message: 'Sender ID and receiver ID required' });
    }

    const existing = await query(
        'SELECT id FROM interests WHERE sender_id = ? AND receiver_id = ?',
        [sender_id, receiver_id]
    );

    if (existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Interest already sent' });
    }

    const reverse = await query(
        'SELECT id FROM interests WHERE sender_id = ? AND receiver_id = ?',
        [receiver_id, sender_id]
    );

    const status = reverse.length > 0 ? 'matched' : 'pending';

    await execute(
        'INSERT INTO interests (sender_id, receiver_id, status, created_at) VALUES (?, ?, ?, NOW())',
        [sender_id, receiver_id, status]
    );

    if (status === 'matched') {
        await execute(
            'UPDATE interests SET status = ? WHERE sender_id = ? AND receiver_id = ?',
            ['matched', receiver_id, sender_id]
        );
    }

    return res.status(200).json({
        success: true,
        message: status === 'matched' ? 'It\'s a match!' : 'Interest sent successfully',
        matched: status === 'matched'
    });
}

// ========== MY MATCHES ==========
async function handleMyMatches(req, res) {
    const { user_id } = req.query;

    if (!user_id) {
        return res.status(400).json({ success: false, message: 'User ID required' });
    }

    const matches = await query(`
        SELECT 
            u.id, u.student_id, u.first_name, u.last_name, u.gender,
            p.photo, p.occupation
        FROM interests i
        INNER JOIN users u ON (
            (i.sender_id = ? AND i.receiver_id = u.id) OR
            (i.receiver_id = ? AND i.sender_id = u.id)
        )
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE i.status = 'matched'
        GROUP BY u.id
    `, [user_id, user_id]);

    return res.status(200).json({ success: true, data: matches });
}

// ========== CHECK MATCH ==========
async function handleCheckMatch(req, res) {
    const { user_id, target_id } = req.query;

    if (!user_id || !target_id) {
        return res.status(400).json({ success: false, message: 'User ID and target ID required' });
    }

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

    return res.status(200).json({
        success: true,
        sent_interest: sentInterest,
        received_interest: receivedInterest,
        matched: matched
    });
}
