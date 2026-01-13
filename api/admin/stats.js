import { query } from '../_lib/db.js';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Total Users
        const totalUsersResult = await query('SELECT COUNT(*) as count FROM users');
        const totalUsers = totalUsersResult[0]?.count || 0;

        // Pending Account Verifications
        const pendingResult = await query("SELECT COUNT(*) as count FROM users WHERE verification_status = 'pending'");
        const pending = pendingResult[0]?.count || 0;

        // Verified Profiles
        const verifiedResult = await query("SELECT COUNT(*) as count FROM users WHERE verification_status = 'verified'");
        const verified = verifiedResult[0]?.count || 0;

        // Total Matches (interests with status = 'matched')
        let matches = 0;
        try {
            const matchesResult = await query("SELECT COUNT(*) as count FROM interests WHERE status = 'matched'");
            matches = matchesResult[0]?.count || 0;
        } catch (e) {
            // Table might not have status column
            matches = 0;
        }

        res.status(200).json({
            success: true,
            total_users: totalUsers,
            pending: pending,
            verified: verified,
            matches: matches
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            total_users: 0,
            pending: 0,
            verified: 0,
            matches: 0
        });
    }
}
