<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Prevent crashing if JSON is invalid or empty
if (!is_array($data)) {
    $data = [];
}

$username = $data['username'] ?? '';
$password = $data['password'] ?? '';

// Default Credentials
$stored_username = getenv('ADMIN_USERNAME') ?: 'Rukeeey';
$stored_password = getenv('ADMIN_PASSWORD') ?: 'Rukeeey@143';

// Try to override from config file if exists (silently ignore errors)
$config_file = __DIR__ . '/../../config/admin_config.json';
if (file_exists($config_file)) {
    $file_content = file_get_contents($config_file);
    if ($file_content) {
        $config = json_decode($file_content, true);
        if ($config) {
            $stored_username = $config['username'] ?? $stored_username;
            $stored_password = $config['password'] ?? $stored_password;
        }
    }
}

if ($username === $stored_username && $password === $stored_password) {
    // Stateless login: Client handles the token/flag via localStorage
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid username or password']);
}
?>
