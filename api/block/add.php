<?php
// api/block/add.php - Block a user
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
$reason = trim(htmlspecialchars($data['reason'] ?? '', ENT_QUOTES, 'UTF-8'));
$blocker_id = $_SESSION['user_id'];

if (!$blocked_id || $blocked_id == $blocker_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid user']);
    exit;
}

// Check if already blocked
$check = $conn->prepare("SELECT id FROM blocked_users WHERE blocker_id = ? AND blocked_id = ?");
$check->bind_param("ii", $blocker_id, $blocked_id);
$check->execute();

if ($check->get_result()->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'User already blocked']);
    exit;
}

// Block user
$stmt = $conn->prepare("INSERT INTO blocked_users (blocker_id, blocked_id, reason) VALUES (?, ?, ?)");
$stmt->bind_param("iis", $blocker_id, $blocked_id, $reason);

if ($stmt->execute()) {
    // Also remove from favorites and interests
    $conn->query("DELETE FROM favorites WHERE user_id = $blocker_id AND favorite_id = $blocked_id");
    $conn->query("DELETE FROM interests WHERE from_user_id = $blocker_id AND to_user_id = $blocked_id");
    
    echo json_encode(['success' => true, 'message' => 'User blocked successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to block user']);
}

$conn->close();
?>
