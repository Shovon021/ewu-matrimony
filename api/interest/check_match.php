<?php
// api/interest/check_match.php - Check if mutual interest exists
header('Content-Type: application/json');
session_start();

require_once '../../config/db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login first']);
    exit;
}

$other_user_id = $_GET['user_id'] ?? 0;
$my_id = $_SESSION['user_id'];

if (!$other_user_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid user']);
    exit;
}

// Check if I liked them
$stmt = $conn->prepare("SELECT id FROM interests WHERE from_user_id = ? AND to_user_id = ?");
$stmt->bind_param("ii", $my_id, $other_user_id);
$stmt->execute();
$i_liked = $stmt->get_result()->num_rows > 0;

// Check if they liked me
$stmt = $conn->prepare("SELECT id FROM interests WHERE from_user_id = ? AND to_user_id = ?");
$stmt->bind_param("ii", $other_user_id, $my_id);
$stmt->execute();
$they_liked = $stmt->get_result()->num_rows > 0;

$is_match = $i_liked && $they_liked;

echo json_encode([
    'success' => true,
    'i_liked' => $i_liked,
    'they_liked' => $they_liked,
    'is_match' => $is_match
]);

$conn->close();
?>
