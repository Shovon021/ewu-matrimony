<?php
// api/admin/update_credentials.php
// Allows admin to update username and password
header('Content-Type: application/json');
session_start();

// ADMIN AUTH CHECK
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$current_password = $data['current_password'] ?? '';
$new_username = trim($data['new_username'] ?? '');
$new_password = $data['new_password'] ?? '';

// Validate current password
$stored_username = getenv('ADMIN_USERNAME') ?: 'Rukeeey';
$stored_password = getenv('ADMIN_PASSWORD') ?: 'Rukeeey@143';

if ($current_password !== $stored_password) {
    echo json_encode(['success' => false, 'message' => 'Current password is incorrect']);
    exit;
}

// Validate new credentials
if (empty($new_username) || strlen($new_username) < 3) {
    echo json_encode(['success' => false, 'message' => 'Username must be at least 3 characters']);
    exit;
}

if (!empty($new_password) && strlen($new_password) < 6) {
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters']);
    exit;
}

// Save to a local config file (for non-env deployments)
$config_file = __DIR__ . '/../../config/admin_config.json';
$config = [
    'username' => $new_username,
    'password' => !empty($new_password) ? $new_password : $stored_password,
    'updated_at' => date('Y-m-d H:i:s')
];

if (file_put_contents($config_file, json_encode($config, JSON_PRETTY_PRINT))) {
    echo json_encode([
        'success' => true, 
        'message' => 'Credentials updated successfully! Please login again.',
        'logout' => true
    ]);
    // Force logout
    session_destroy();
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to save. Check file permissions.']);
}
?>
