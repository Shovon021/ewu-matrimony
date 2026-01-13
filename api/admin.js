import { query, execute } from './_lib/db.js';

// Consolidated Admin API - handles all admin endpoints via ?action= parameter
export default async function handler(req, res) {
    // CORS headers
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
            case 'login':
                return handleLogin(req, res);
            case 'stats':
                return handleStats(req, res);
            case 'get_pending':
                return handleGetPending(req, res);
            case 'get_pending_biodatas':
                return handleGetPendingBiodatas(req, res);
            case 'get_biodata_details':
                return handleGetBiodataDetails(req, res);
            case 'verify_user':
                return handleVerifyUser(req, res);
            case 'verify_biodata':
                return handleVerifyBiodata(req, res);
            case 'get_messages':
                return handleGetMessages(req, res);
            case 'update_credentials':
                return handleUpdateCredentials(req, res);
            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Admin API error:', error);
        return res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}

// ========== LOGIN ==========
async function handleLogin(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password required' });
    }

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Rukeeey';

    if (username === adminUsername && password === adminPassword) {
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            admin: { username: adminUsername }
        });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
}

// ========== STATS ==========
async function handleStats(req, res) {
    const totalUsersResult = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = totalUsersResult[0]?.count || 0;

    const pendingResult = await query("SELECT COUNT(*) as count FROM users WHERE verification_status = 'pending'");
    const pending = pendingResult[0]?.count || 0;

    const verifiedResult = await query("SELECT COUNT(*) as count FROM users WHERE verification_status = 'verified'");
    const verified = verifiedResult[0]?.count || 0;

    let matches = 0;
    try {
        const matchesResult = await query("SELECT COUNT(*) as count FROM interests WHERE status = 'accepted'");
        matches = matchesResult[0]?.count || 0;
    } catch (e) {
        // interests table might not exist or have different schema
        matches = 0;
    }

    return res.status(200).json({
        success: true,
        stats: {
            total_users: totalUsers,
            pending_accounts: pending,
            verified_biodatas: verified,
            total_matches: matches
        }
    });
}

// ========== GET PENDING USERS ==========
async function handleGetPending(req, res) {
    try {
        const users = await query(`
            SELECT student_id, first_name, last_name, status, batch_year, id_card_image 
            FROM users 
            WHERE verification_status = 'pending'
            ORDER BY created_at DESC
        `);
        return res.status(200).json(users);
    } catch (e) {
        console.error('Get pending error:', e);
        return res.status(500).json({ success: false, message: 'Database error: ' + e.message });
    }
}

// ========== GET PENDING BIODATAS ==========
async function handleGetPendingBiodatas(req, res) {
    try {
        const biodatas = await query(`
            SELECT u.student_id, u.first_name, u.last_name, u.gender, p.occupation, p.updated_at
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE p.biodata_status = 'pending'
            ORDER BY p.updated_at DESC
        `);
        return res.status(200).json(biodatas);
    } catch (e) {
        // If profiles table doesn't exist, return empty array
        return res.status(200).json([]);
    }
}

// ========== GET BIODATA DETAILS ==========
async function handleGetBiodataDetails(req, res) {
    const studentId = req.query.student_id;
    if (!studentId) {
        return res.status(400).json({ success: false, message: 'Student ID required' });
    }

    const users = await query('SELECT * FROM users WHERE student_id = ?', [studentId]);
    if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { password, ...safeUser } = users[0];
    return res.status(200).json({ success: true, data: safeUser });
}

// ========== VERIFY USER ==========
async function handleVerifyUser(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { studentId, action } = req.body || {};
    if (!studentId || !action) {
        return res.status(400).json({ success: false, message: 'Student ID and action required' });
    }

    const status = action === 'approve' ? 'verified' : 'rejected';
    await execute('UPDATE users SET verification_status = ? WHERE student_id = ?', [status, studentId]);

    return res.status(200).json({ success: true, message: `User ${status} successfully` });
}

// ========== VERIFY BIODATA ==========
async function handleVerifyBiodata(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { studentId, action } = req.body || {};
    if (!studentId || !action) {
        return res.status(400).json({ success: false, message: 'Student ID and action required' });
    }

    const status = action === 'approve' ? 'verified' : 'rejected';
    await execute('UPDATE users SET biodata_status = ? WHERE student_id = ?', [status, studentId]);

    return res.status(200).json({ success: true, message: `Biodata ${status} successfully` });
}

// ========== GET MESSAGES ==========
async function handleGetMessages(req, res) {
    const messages = await query(`
        SELECT id, name, email, subject, message, created_at
        FROM contact_messages
        ORDER BY created_at DESC
        LIMIT 50
    `);
    return res.status(200).json({ success: true, messages });
}

// ========== UPDATE CREDENTIALS ==========
async function handleUpdateCredentials(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { current_password, new_username, new_password } = req.body || {};
    const adminPassword = process.env.ADMIN_PASSWORD || 'Rukeeey';

    if (current_password !== adminPassword) {
        return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Note: In serverless, we can't persist env changes. This just validates.
    return res.status(200).json({
        success: true,
        message: 'Credentials validated. To change credentials, update Vercel environment variables.',
        logout: false
    });
}
