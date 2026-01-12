<?php
// api/profile/get_public.php
header('Content-Type: application/json');
session_start();

require_once '../../config/db.php';

if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Profile ID required']);
    exit;
}

$profile_id = intval($_GET['id']);

// Get user basic info + profile (all fields)
// Note: In a real app, you might hide sensitive info like phone number/email for public view
// But for now we return mostly everything as requested
$sql = "SELECT u.first_name, u.last_name, u.gender, u.dob, u.religion, u.batch_year,
        p.*
        FROM users u
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE u.id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $profile_id);
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
