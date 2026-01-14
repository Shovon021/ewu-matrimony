
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadImage(fileData, folder = 'ewu-matrimony') {
    if (!fileData) return null;

    try {
        const result = await cloudinary.uploader.upload(fileData, {
            folder: folder,
            resource_type: 'auto'
        });
        return result.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
}
