<?php
session_start();
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

// Load credentials from config file if exists, otherwise use defaults/env
$config_file = __DIR__ . '/../../config/admin_config.json';
if (file_exists($config_file)) {
    $config = json_decode(file_get_contents($config_file), true);
    $stored_username = $config['username'] ?? 'Rukeeey';
    $stored_password = $config['password'] ?? 'Rukeeey@143';
} else {
    // Fallback to environment variables or hardcoded defaults
    $stored_username = getenv('ADMIN_USERNAME') ?: 'Rukeeey';
    $stored_password = getenv('ADMIN_PASSWORD') ?: 'Rukeeey@143';
}

if ($username === $stored_username && $password === $stored_password) {
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_username'] = $username;
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
}
?>
