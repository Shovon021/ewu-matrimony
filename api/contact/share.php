<?php
// api/contact/share.php
header('Content-Type: application/json');
session_start();
require_once '../../config/db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$target_user_id = $data['target_user_id'] ?? 0;
$my_id = $_SESSION['user_id'];

if (!$target_user_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid user']);
    exit;
}

// Insert into contact_shares (ignore if already exists)
$stmt = $conn->prepare("INSERT IGNORE INTO contact_shares (from_user_id, to_user_id) VALUES (?, ?)");
$stmt->bind_param("ii", $my_id, $target_user_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Contact shared successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}

$conn->close();
?>
