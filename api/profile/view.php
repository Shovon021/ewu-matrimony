<?php
// api/profile/view.php - Record a profile view
header('Content-Type: application/json');
session_start();

require_once '../../config/db.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$viewed_id = $_GET['user_id'] ?? 0;
$viewer_id = $_SESSION['user_id'];

if (!$viewed_id || $viewed_id == $viewer_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid user']);
    exit;
}

// Insert or update view (ON DUPLICATE KEY updates timestamp)
$stmt = $conn->prepare("INSERT INTO profile_views (viewer_id, viewed_id) VALUES (?, ?) 
                        ON DUPLICATE KEY UPDATE viewed_at = CURRENT_TIMESTAMP");
$stmt->bind_param("ii", $viewer_id, $viewed_id);
$stmt->execute();

echo json_encode(['success' => true]);
$conn->close();
?>
