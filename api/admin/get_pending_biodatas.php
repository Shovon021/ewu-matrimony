<?php
// api/admin/get_pending_biodatas.php
// Returns biodatas that are pending admin verification
header('Content-Type: application/json');
session_start();

// ADMIN AUTH CHECK
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

require_once '../../config/db.php';

$sql = "SELECT 
    u.student_id, u.first_name, u.last_name, u.gender, u.batch_year, u.status as student_status,
    p.photo, p.occupation, p.biodata_status, p.updated_at
    FROM users u
    INNER JOIN profiles p ON u.id = p.user_id
    WHERE p.biodata_status = 'pending'
    ORDER BY p.updated_at ASC";

$result = $conn->query($sql);

$biodatas = [];
if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $biodatas[] = $row;
    }
}

echo json_encode($biodatas);
$conn->close();
?>
