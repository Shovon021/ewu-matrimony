<?php
// api/chat/get.php - Get chat messages between current user and another user
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

// Get messages between the two users
$stmt = $conn->prepare("
    SELECT m.*, 
           CASE WHEN m.from_user_id = ? THEN 'sent' ELSE 'received' END as direction
    FROM messages m
    WHERE (m.from_user_id = ? AND m.to_user_id = ?)
       OR (m.from_user_id = ? AND m.to_user_id = ?)
    ORDER BY m.sent_at ASC
");
$stmt->bind_param("iiiii", $my_id, $my_id, $other_user_id, $other_user_id, $my_id);
$stmt->execute();
$result = $stmt->get_result();

$messages = [];
while ($row = $result->fetch_assoc()) {
    $messages[] = $row;
}

// Mark messages as read
$update = $conn->prepare("UPDATE messages SET is_read = TRUE WHERE from_user_id = ? AND to_user_id = ?");
$update->bind_param("ii", $other_user_id, $my_id);
$update->execute();

echo json_encode(['success' => true, 'messages' => $messages]);

$conn->close();
?>
