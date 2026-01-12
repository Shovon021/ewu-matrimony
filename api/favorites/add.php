<?php
// api/favorites/add.php - Add to favorites/shortlist
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
$favorite_id = $data['user_id'] ?? 0;
$user_id = $_SESSION['user_id'];

if (!$favorite_id || $favorite_id == $user_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid user']);
    exit;
}

// Check if already in favorites
$check = $conn->prepare("SELECT id FROM favorites WHERE user_id = ? AND favorite_id = ?");
$check->bind_param("ii", $user_id, $favorite_id);
$check->execute();

if ($check->get_result()->num_rows > 0) {
    // Remove from favorites
    $delete = $conn->prepare("DELETE FROM favorites WHERE user_id = ? AND favorite_id = ?");
    $delete->bind_param("ii", $user_id, $favorite_id);
    $delete->execute();
    echo json_encode(['success' => true, 'action' => 'removed', 'message' => 'Removed from shortlist']);
} else {
    // Add to favorites
    $insert = $conn->prepare("INSERT INTO favorites (user_id, favorite_id) VALUES (?, ?)");
    $insert->bind_param("ii", $user_id, $favorite_id);
    $insert->execute();
    echo json_encode(['success' => true, 'action' => 'added', 'message' => 'Added to shortlist']);
}

$conn->close();
?>
