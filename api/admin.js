import { query, execute } from './_lib/db.js';
import crypto from 'crypto';

// ========== ADMIN TOKEN AUTHENTICATION (STATELESS) ==========
// Serverless-friendly: Uses HMAC signature instead of in-memory store
const ADMIN_SECRET = process.env.ADMIN_PASSWORD || 'Rukeeey'; // Secret key for signing

function generateAdminToken() {
    const payload = JSON.stringify({
        role: 'admin',
        created: Date.now(),
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    });

    // Create base64 payload
    const data = Buffer.from(payload).toString('base64');

    // Sign the payload
    const signature = crypto
        .createHmac('sha256', ADMIN_SECRET)
        .update(data)
        .digest('hex');

    // Return format: payload.signature
    return `${data}.${signature}`;
}

function validateAdminToken(req) {
    const authHeader = req.headers['authorization'] || req.headers['x-admin-token'];
    const token = authHeader?.replace('Bearer ', '');

    if (!token || !token.includes('.')) return false;

    const [data, signature] = token.split('.');

    // 1. Verify signature
    const expectedSignature = crypto
        .createHmac('sha256', ADMIN_SECRET)
        .update(data)
        .digest('hex');

    if (signature !== expectedSignature) return false;

    // 2. Check expiration
    try {
        const payload = JSON.parse(Buffer.from(data, 'base64').toString());
        if (Date.now() > payload.expires) return false;
        return true;
    } catch (e) {
        return false;
    }
}

function requireAuth(req, res) {
    if (!validateAdminToken(req)) {
        res.status(401).json({ success: false, message: 'Unauthorized or session expired.' });
        return false;
    }
    return true;
}

// Consolidated Admin API - handles all admin endpoints via ?action= parameter
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const action = req.query.action || 'stats';

    try {
        switch (action) {
            case 'login':
                return await handleLogin(req, res);
            case 'stats':
                return await handleStats(req, res);
            case 'get_pending':
                return await handleGetPending(req, res);
            case 'get_pending_biodatas':
                return await handleGetPendingBiodatas(req, res);
            case 'get_biodata_details':
                return await handleGetBiodataDetails(req, res);
            case 'verify_user':
                return await handleVerifyUser(req, res);
            case 'verify_biodata':
                return await handleVerifyBiodata(req, res);
            case 'get_messages':
                return await handleGetMessages(req, res);
            case 'update_credentials':
                return await handleUpdateCredentials(req, res);
            case 'get_all_users':
                return await handleGetAllUsers(req, res);
            case 'get_analytics':
                return await handleGetAnalytics(req, res);
            case 'delete_user':
                return await handleDeleteUser(req, res);
            case 'suspend_user':
                return await handleSuspendUser(req, res);
            case 'get_match_history':
                return await handleGetMatchHistory(req, res);
            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }
    } catch (error) {
        console.error('CRITICAL ADMIN API ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error: ' + error.message,
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

// ... existing handlers ...

// ========== GET MATCH HISTORY ==========
async function handleGetMatchHistory(req, res) {
    if (!requireAuth(req, res)) return;
    try {
        const matches = await query(`
            SELECT 
                i.id, i.created_at,
                u1.first_name as s_name, u1.last_name as s_last, u1.student_id as s_id,
                u2.first_name as r_name, u2.last_name as r_last, u2.student_id as r_id
            FROM interests i
            INNER JOIN users u1 ON i.sender_id = u1.id
            INNER JOIN users u2 ON i.receiver_id = u2.id
            WHERE i.status = 'matched'
            ORDER BY i.created_at DESC
            LIMIT 50
        `);

        return res.status(200).json({ success: true, matches });
    } catch (e) {
        console.error('Get match history error:', e);
        // If table doesn't exist or has different schema, return empty array gracefully
        if (e.message.includes('Unknown column') || e.message.includes("doesn't exist") || e.message.includes("Table")) {
            return res.status(200).json({ success: true, matches: [], note: 'No match data available yet' });
        }
        return res.status(500).json({ success: false, message: 'Database error: ' + e.message });
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
        // Generate secure token
        const token = generateAdminToken();

        // Store token with expiry
        ADMIN_TOKENS.set(token, {
            username: adminUsername,
            createdAt: Date.now(),
            expiresAt: Date.now() + TOKEN_EXPIRY_MS
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            admin: { username: adminUsername },
            token: token // Client must store and send this with requests
        });
    } else {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
}

// ========== STATS ==========
async function handleStats(req, res) {
    if (!requireAuth(req, res)) return;
    try {
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
    } catch (e) {
        console.error('Stats error:', e);
        return res.status(500).json({ success: false, message: 'Database error: ' + e.message });
    }
}

// ========== GET PENDING USERS ==========
async function handleGetPending(req, res) {
    if (!requireAuth(req, res)) return;
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
        // DEBUG: Show what user/db is being used (hiding password)
        const debugInfo = `User: ${process.env.DB_USER}, DB: ${process.env.DB_NAME}, Host: ${process.env.DB_HOST}`;
        return res.status(500).json({
            success: false,
            message: 'Database error: ' + e.message,
            debug: debugInfo
        });
    }
}

// ========== GET PENDING BIODATAS ==========
async function handleGetPendingBiodatas(req, res) {
    if (!requireAuth(req, res)) return;
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
    if (!requireAuth(req, res)) return;
    const studentId = req.query.student_id;
    if (!studentId) {
        return res.status(400).json({ success: false, message: 'Student ID required' });
    }

    try {
        // Fetch User and Profile data joined
        const users = await query(`
            SELECT 
                u.id as user_pk, u.student_id, u.first_name, u.last_name, u.email, u.phone, 
                u.gender, u.dob, u.religion, u.status, u.batch_year, 
                u.verification_status, u.id_card_image, u.created_at,
                p.*
            FROM users u
            LEFT JOIN profiles p ON u.id = p.user_id
            WHERE u.student_id = ?
        `, [studentId]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const data = users[0];
        // Remove sensitive data
        delete data.password;

        return res.status(200).json({ success: true, data: data });
    } catch (e) {
        console.error('Get biodata error:', e);
        return res.status(500).json({ success: false, message: 'Database error: ' + e.message });
    }
}

// ========== VERIFY USER ==========
async function handleVerifyUser(req, res) {
    if (!requireAuth(req, res)) return;
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { studentId, action } = req.body || {};
    if (!studentId || !action) {
        return res.status(400).json({ success: false, message: 'Student ID and action required' });
    }

    try {
        const status = action === 'approve' ? 'verified' : 'rejected';
        await execute('UPDATE users SET verification_status = ? WHERE student_id = ?', [status, studentId]);

        return res.status(200).json({ success: true, message: `User ${status} successfully` });
    } catch (e) {
        console.error('Verify user error:', e);
        return res.status(500).json({ success: false, message: 'Database error: ' + e.message });
    }
}

// ========== VERIFY BIODATA ==========
async function handleVerifyBiodata(req, res) {
    if (!requireAuth(req, res)) return;
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { studentId, action } = req.body || {};
    if (!studentId || !action) {
        return res.status(400).json({ success: false, message: 'Student ID and action required' });
    }

    try {
        const status = action === 'approve' ? 'verified' : 'rejected';
        // Fix: Update profiles table, joining with users to find by student_id
        await execute(`
            UPDATE profiles p
            JOIN users u ON p.user_id = u.id
            SET p.biodata_status = ?
            WHERE u.student_id = ?
        `, [status, studentId]);

        return res.status(200).json({ success: true, message: `Biodata ${status} successfully` });
    } catch (e) {
        console.error('Verify biodata error:', e);
        return res.status(500).json({ success: false, message: 'Database error: ' + e.message });
    }
}

// ========== GET MESSAGES ==========
async function handleGetMessages(req, res) {
    if (!requireAuth(req, res)) return;
    try {
        const messages = await query(`
            SELECT id, name, email, subject, message, created_at
            FROM contact_messages
            ORDER BY created_at DESC
            LIMIT 50
        `);
        return res.status(200).json({ success: true, messages });
    } catch (e) {
        console.error('Get messages error:', e);
        // Return empty array on error so UI doesn't crash
        return res.status(200).json({ success: true, messages: [] });
    }
}

// ========== UPDATE CREDENTIALS ==========
async function handleUpdateCredentials(req, res) {
    if (!requireAuth(req, res)) return;

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

// ========== GET ALL USERS ==========
async function handleGetAllUsers(req, res) {
    // Require authentication
    if (!requireAuth(req, res)) return;

    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
        let sql = `
            SELECT u.id, u.student_id, u.first_name, u.last_name, u.email, u.phone,
                   u.gender, u.dob, u.religion, u.batch_year, u.status, 
                   u.verification_status, u.created_at,
                   p.photo, p.biodata_status
            FROM users u
            LEFT JOIN profiles p ON p.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        // Search filter
        if (search) {
            sql += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.student_id LIKE ? OR u.email LIKE ?)`;
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Status filter
        if (status && status !== 'all') {
            sql += ` AND u.verification_status = ?`;
            params.push(status);
        }

        // Use inline values for LIMIT/OFFSET (MySQL param binding can be problematic)
        const limitVal = Math.max(1, Math.min(100, parseInt(limit) || 20));
        const offsetVal = Math.max(0, parseInt(offset) || 0);
        sql += ` ORDER BY u.created_at DESC LIMIT ${limitVal} OFFSET ${offsetVal}`;

        const users = await query(sql, params);

        // Get total count for pagination
        let countSql = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
        const countParams = [];
        if (search) {
            countSql += ` AND (first_name LIKE ? OR last_name LIKE ? OR student_id LIKE ?)`;
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm);
        }
        if (status && status !== 'all') {
            countSql += ` AND verification_status = ?`;
            countParams.push(status);
        }
        const countResult = await query(countSql, countParams);
        const total = countResult[0]?.total || 0;

        return res.status(200).json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (e) {
        console.error('Get all users error:', e);
        return res.status(500).json({ success: false, message: 'Database error: ' + e.message });
    }
}

// ========== GET ANALYTICS ==========
async function handleGetAnalytics(req, res) {
    if (!requireAuth(req, res)) return;
    try {
        // Gender distribution
        const genderData = await query(`
            SELECT gender, COUNT(*) as count 
            FROM users 
            WHERE verification_status = 'verified'
            GROUP BY gender
        `);

        // Registration trends (last 7 days)
        const trendsData = await query(`
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM users
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);

        // Today's activity
        const todaySignups = await query(`
            SELECT COUNT(*) as count FROM users 
            WHERE DATE(created_at) = CURDATE()
        `);
        const todayMessages = await query(`
            SELECT COUNT(*) as count FROM contact_messages 
            WHERE DATE(created_at) = CURDATE()
        `);
        let todayInterests = 0;
        try {
            const interestResult = await query(`
                SELECT COUNT(*) as count FROM interests 
                WHERE DATE(created_at) = CURDATE()
            `);
            todayInterests = interestResult[0]?.count || 0;
        } catch (e) { /* interests table might not exist */ }

        return res.status(200).json({
            success: true,
            analytics: {
                genderDistribution: genderData,
                registrationTrends: trendsData,
                todayActivity: {
                    signups: todaySignups[0]?.count || 0,
                    messages: todayMessages[0]?.count || 0,
                    interests: todayInterests
                }
            }
        });
    } catch (e) {
        console.error('Get analytics error:', e);
        return res.status(500).json({ success: false, message: 'Database error: ' + e.message });
    }
}

// ========== DELETE USER ==========
async function handleDeleteUser(req, res) {
    // Require authentication
    if (!requireAuth(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { userId } = req.body || {};
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID required' });
    }

    try {
        // Delete profile first (foreign key)
        await execute('DELETE FROM profiles WHERE user_id = ?', [userId]);
        // Delete user
        await execute('DELETE FROM users WHERE id = ?', [userId]);

        return res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (e) {
        console.error('Delete user error:', e);
        return res.status(500).json({ success: false, message: 'Database error: ' + e.message });
    }
}

// ========== SUSPEND USER ==========
async function handleSuspendUser(req, res) {
    // Require authentication
    if (!requireAuth(req, res)) return;

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { userId, action } = req.body || {}; // action: 'suspend' or 'unsuspend'
    if (!userId) {
        return res.status(400).json({ success: false, message: 'User ID required' });
    }

    try {
        const newStatus = action === 'unsuspend' ? 'verified' : 'suspended';
        await execute('UPDATE users SET verification_status = ? WHERE id = ?', [newStatus, userId]);

        return res.status(200).json({
            success: true,
            message: action === 'unsuspend' ? 'User unsuspended' : 'User suspended'
        });
    } catch (e) {
        console.error('Suspend user error:', e);
        return res.status(500).json({ success: false, message: 'Database error: ' + e.message });
    }
}
