<?php
// api/favorites/list.php - Get my favorites/shortlist
header('Content-Type: application/json');
session_start();

require_once '../../config/db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login first']);
    exit;
}

$user_id = $_SESSION['user_id'];

$sql = "SELECT u.id, u.first_name, u.last_name, u.gender, p.photo, p.occupation, p.education, f.created_at
        FROM favorites f
        INNER JOIN users u ON f.favorite_id = u.id
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$favorites = [];
while ($row = $result->fetch_assoc()) {
    $favorites[] = $row;
}

echo json_encode(['success' => true, 'favorites' => $favorites]);

$conn->close();
?>
