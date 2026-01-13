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
        const { current_password, new_username, new_password } = req.body || {};

        // Get current admin credentials
        const currentUsername = process.env.ADMIN_USERNAME || 'admin';
        const currentPassword = process.env.ADMIN_PASSWORD || 'Rukeeey';

        // Verify current password
        if (current_password !== currentPassword) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // Note: In a serverless environment, we can't actually update env vars at runtime
        // This endpoint would need to use a database or external config service
        // For now, we'll just validate and return success (actual update requires Vercel dashboard)

        res.status(200).json({
            success: true,
            message: 'Credentials verified. To update, please change ADMIN_USERNAME and ADMIN_PASSWORD in Vercel Environment Variables.'
        });

    } catch (error) {
        console.error('Update credentials error:', error);
        res.status(500).json({ success: false, message: 'Server error: ' + error.message });
    }
}
