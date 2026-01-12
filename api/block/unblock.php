<?php
// api/block/unblock.php - Unblock a user
header('Content-Type: application/json');
session_start();

require_once '../../config/db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login first']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$blocked_id = $data['user_id'] ?? 0;
$blocker_id = $_SESSION['user_id'];

if (!$blocked_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid user']);
    exit;
}

$stmt = $conn->prepare("DELETE FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?");
$stmt->bind_param("ii", $blocker_id, $blocked_id);

if ($stmt->execute() && $stmt->affected_rows > 0) {
    echo json_encode(['success' => true, 'message' => 'User unblocked']);
} else {
    echo json_encode(['success' => false, 'message' => 'User was not blocked']);
}

$conn->close();
?>
