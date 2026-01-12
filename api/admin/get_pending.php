<?php
// api/admin/get_pending.php
header('Content-Type: application/json');
session_start();

// ADMIN AUTH CHECK
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once '../../config/db.php';

// Using backticks to prevent any keyword conflicts or hidden char issues
$sql = "SELECT `student_id`, `first_name`, `last_name`, `status`, `batch_year`, `id_card_image` FROM `users` WHERE `verification_status` = 'pending'";

$result = $conn->query($sql);

if (!$result) {
    // Return proper JSON error if SQL fails
    echo json_encode(['success' => false, 'message' => 'DB Error: ' . $conn->error]);
    exit;
}

$users = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
}

echo json_encode($users);
$conn->close();
?>
