<?php
// api/interest/send.php - Express interest in a profile
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
$to_user_id = $data['to_user_id'] ?? 0;
$from_user_id = $_SESSION['user_id'];

if (!$to_user_id || $to_user_id == $from_user_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid user']);
    exit;
}

// Check if already expressed interest
$check = $conn->prepare("SELECT id FROM interests WHERE from_user_id = ? AND to_user_id = ?");
$check->bind_param("ii", $from_user_id, $to_user_id);
$check->execute();
if ($check->get_result()->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'You already expressed interest']);
    exit;
}

// Insert interest
$stmt = $conn->prepare("INSERT INTO interests (from_user_id, to_user_id) VALUES (?, ?)");
$stmt->bind_param("ii", $from_user_id, $to_user_id);

if ($stmt->execute()) {
    // Check if mutual interest exists
    $mutual = $conn->prepare("SELECT id FROM interests WHERE from_user_id = ? AND to_user_id = ?");
    $mutual->bind_param("ii", $to_user_id, $from_user_id);
    $mutual->execute();
    $is_match = $mutual->get_result()->num_rows > 0;
    
    echo json_encode([
        'success' => true, 
        'message' => $is_match ? "It's a match! You can now chat." : "Interest sent!",
        'is_match' => $is_match
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $conn->error]);
}

$conn->close();
?>
