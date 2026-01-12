<?php
// api/admin/verify_biodata.php
// Admin can approve or reject a biodata
header('Content-Type: application/json');

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

// Get user_id from student_id
$sql = "SELECT id FROM users WHERE student_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

$user = $result->fetch_assoc();
$user_id = $user['id'];

// Update biodata status
$sql = "UPDATE profiles SET biodata_status = ? WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $new_status, $user_id);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => "Biodata $new_status successfully"]);
} else {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
}

$stmt->close();
$conn->close();
?>
