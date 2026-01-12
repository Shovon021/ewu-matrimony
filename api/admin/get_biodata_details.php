<?php
// api/admin/get_biodata_details.php
// Returns full biodata for a specific user (for admin review)
header('Content-Type: application/json');
session_start();

// ADMIN AUTH CHECK
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once '../../config/db.php';

$student_id = $_GET['student_id'] ?? '';

if (empty($student_id)) {
    echo json_encode(['success' => false, 'message' => 'Student ID required']);
    exit;
}

$sql = "SELECT 
    u.student_id, u.first_name, u.last_name, u.email, u.phone, u.gender, u.dob, u.religion, u.batch_year, u.status as student_status,
    p.*
    FROM users u
    INNER JOIN profiles p ON u.id = p.user_id
    WHERE u.student_id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $data = $result->fetch_assoc();
    echo json_encode(['success' => true, 'data' => $data]);
} else {
    echo json_encode(['success' => false, 'message' => 'Biodata not found']);
}

$stmt->close();
$conn->close();
?>
