
import crypto from 'crypto';

const ADMIN_SECRET = 'Rukeeey';

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

try {
    const token = generateAdminToken();
    console.log("Token generated:", token);

    const [data, signature] = token.split('.');
    const expectedSignature = crypto
        .createHmac('sha256', ADMIN_SECRET)
        .update(data)
        .digest('hex');

    console.log("Signature match:", signature === expectedSignature);

} catch (e) {
    console.error("Error:", e);
}
