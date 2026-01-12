<?php
// api/chat/send.php - Send a message to a matched user
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
$message = trim($data['message'] ?? '');
$from_user_id = $_SESSION['user_id'];

if (!$to_user_id || empty($message)) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

// Verify they are matched (both liked each other)
$check = $conn->prepare("
    SELECT 1 FROM interests i1
    INNER JOIN interests i2 ON i1.to_user_id = i2.from_user_id AND i1.from_user_id = i2.to_user_id
    WHERE i1.from_user_id = ? AND i1.to_user_id = ?
");
$check->bind_param("ii", $from_user_id, $to_user_id);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'You can only chat with matched users']);
    exit;
}

// Insert message
$stmt = $conn->prepare("INSERT INTO messages (from_user_id, to_user_id, message) VALUES (?, ?, ?)");
$stmt->bind_param("iis", $from_user_id, $to_user_id, $message);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message_id' => $conn->insert_id]);
} else {
    echo json_encode(['success' => false, 'message' => 'Error sending message']);
}

$conn->close();
?>
