<?php
/**
 * Cloudinary Upload Helper
 * Uses REST API - no external dependencies required
 */

function uploadToCloudinary($filePath, $folder = 'ewu-matrimony') {
    $cloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
    $apiKey = getenv('CLOUDINARY_API_KEY') ?: '';
    $apiSecret = getenv('CLOUDINARY_API_SECRET') ?: '';
    
    // Check if Cloudinary is configured
    if (empty($cloudName) || empty($apiKey) || empty($apiSecret)) {
        return ['success' => false, 'error' => 'Cloudinary not configured'];
    }
    
    $timestamp = time();
    
    // Create signature
    $paramsToSign = [
        'folder' => $folder,
        'timestamp' => $timestamp
    ];
    ksort($paramsToSign);
    $signatureString = http_build_query($paramsToSign) . $apiSecret;
    $signature = sha1($signatureString);
    
    // Prepare upload
    $uploadUrl = "https://api.cloudinary.com/v1_1/{$cloudName}/image/upload";
    
    // Read file
    if (is_uploaded_file($filePath)) {
        $fileData = file_get_contents($filePath);
    } else {
        $fileData = file_get_contents($filePath);
    }
    
    if ($fileData === false) {
        return ['success' => false, 'error' => 'Cannot read file'];
    }
    
    $base64File = 'data:image/jpeg;base64,' . base64_encode($fileData);
    
    // Build POST data
    $postData = [
        'file' => $base64File,
        'api_key' => $apiKey,
        'timestamp' => $timestamp,
        'folder' => $folder,
        'signature' => $signature
    ];
    
    // Make request using cURL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $uploadUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 60);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'error' => 'cURL error: ' . $error];
    }
    
    $result = json_decode($response, true);
    
    if ($httpCode === 200 && isset($result['secure_url'])) {
        return [
            'success' => true,
            'url' => $result['secure_url'],
            'public_id' => $result['public_id']
        ];
    } else {
        return [
            'success' => false,
            'error' => $result['error']['message'] ?? 'Upload failed'
        ];
    }
}

/**
 * Upload file from $_FILES array
 */
function uploadFileToCloudinary($filesArrayKey, $folder = 'ewu-matrimony') {
    if (!isset($_FILES[$filesArrayKey]) || $_FILES[$filesArrayKey]['error'] !== UPLOAD_ERR_OK) {
        return ['success' => false, 'error' => 'No file uploaded or upload error'];
    }
    
    $tmpPath = $_FILES[$filesArrayKey]['tmp_name'];
    return uploadToCloudinary($tmpPath, $folder);
}
?>
