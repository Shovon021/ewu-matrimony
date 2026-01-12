<?php
// api/profile/get.php
header('Content-Type: application/json');
session_start();

require_once '../../config/db.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login first']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Get user basic info + profile (all fields)
$sql = "SELECT u.first_name, u.last_name, u.student_id, u.gender, u.dob, u.phone, u.religion, u.status, u.batch_year,
        p.*
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $data = $result->fetch_assoc();
    echo json_encode(['success' => true, 'data' => $data]);
} else {
    echo json_encode(['success' => false, 'message' => 'Profile not found']);
}

$stmt->close();
$conn->close();
?>
