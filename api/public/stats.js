import { query } from '../_lib/db.js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Public stats (no auth needed)
        const totalUsersResult = await query("SELECT COUNT(*) as count FROM users WHERE verification_status = 'verified'");
        const totalUsers = totalUsersResult[0]?.count || 0;

        const maleResult = await query("SELECT COUNT(*) as count FROM users WHERE gender = 'male' AND verification_status = 'verified'");
        const males = maleResult[0]?.count || 0;

        const femaleResult = await query("SELECT COUNT(*) as count FROM users WHERE gender = 'female' AND verification_status = 'verified'");
        const females = femaleResult[0]?.count || 0;

        let matches = 0;
        try {
            const matchesResult = await query("SELECT COUNT(*) as count FROM interests WHERE status = 'matched'");
            matches = matchesResult[0]?.count || 0;
        } catch (e) {
            matches = 0;
        }

        res.status(200).json({
            success: true,
            total_profiles: totalUsers,
            male_profiles: males,
            female_profiles: females,
            successful_matches: matches
        });

    } catch (error) {
        console.error('Public stats error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}
