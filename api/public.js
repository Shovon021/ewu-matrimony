import { query, execute } from './_lib/db.js';

// Consolidated Public API - handles stats and contact_submit via ?action= parameter
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const action = req.query.action || 'stats';

    try {
        switch (action) {
            case 'stats':
                return handleStats(req, res);
            case 'contact_submit':
                return handleContactSubmit(req, res);
            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Public API error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}

// ========== PUBLIC STATS ==========
async function handleStats(req, res) {
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

    return res.status(200).json({
        success: true,
        total_profiles: totalUsers,
        male_profiles: males,
        female_profiles: females,
        successful_matches: matches
    });
}

// ========== CONTACT SUBMIT ==========
async function handleContactSubmit(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { name, email, subject, message } = req.body || {};

    if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }

    // Store in database
    try {
        await execute(
            'INSERT INTO contact_messages (name, email, subject, message, created_at) VALUES (?, ?, ?, ?, NOW())',
            [name, email, subject || '', message]
        );
    } catch (e) {
        // Table might not exist
    }

    return res.status(200).json({
        success: true,
        message: 'Thank you for your message! We will get back to you soon.'
    });
}
