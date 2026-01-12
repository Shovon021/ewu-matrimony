<?php
// api/profile/viewers.php - Get who viewed my profile
header('Content-Type: application/json');
session_start();

require_once '../../config/db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit;
}

$my_id = $_SESSION['user_id'];

// Get viewers with their basic info
$sql = "SELECT u.id, u.first_name, u.last_name, p.photo, p.occupation, pv.viewed_at
        FROM profile_views pv
        INNER JOIN users u ON pv.viewer_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE pv.viewed_id = ?
        ORDER BY pv.viewed_at DESC
        LIMIT 20";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $my_id);
$stmt->execute();
$result = $stmt->get_result();

$viewers = [];
while ($row = $result->fetch_assoc()) {
    $viewers[] = $row;
}

// Get total view count
$count_sql = "SELECT COUNT(*) as total FROM profile_views WHERE viewed_id = ?";
$count_stmt = $conn->prepare($count_sql);
$count_stmt->bind_param("i", $my_id);
$count_stmt->execute();
$count_result = $count_stmt->get_result()->fetch_assoc();

echo json_encode([
    'success' => true,
    'total_views' => $count_result['total'],
    'viewers' => $viewers
]);

$conn->close();
?>
