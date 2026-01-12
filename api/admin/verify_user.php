<?php
// api/admin/verify_user.php
header('Content-Type: application/json');

// In a real app, check for ADMIN SESSION here!
// if (!isset($_SESSION['is_admin'])) die(...);

require_once '../../config/db.php';

session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);
$student_id = $data['studentId'] ?? '';
$action = $data['action'] ?? ''; // 'approve' or 'reject'

if (empty($student_id) || empty($action)) {
    echo json_encode(['success' => false, 'message' => 'Missing parameters']);
    exit;
}

$new_status = ($action === 'approve') ? 'verified' : 'rejected';

$sql = "UPDATE users SET verification_status = ? WHERE student_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $new_status, $student_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => "User $new_status successfully"]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>
