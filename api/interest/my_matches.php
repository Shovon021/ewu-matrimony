<?php
// api/interest/my_matches.php - Get all mutual matches for current user
header('Content-Type: application/json');
session_start();

require_once '../../config/db.php';

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login first']);
    exit;
}

$my_id = $_SESSION['user_id'];

// Find mutual matches and check contact sharing status
$sql = "SELECT u.id, u.first_name, u.last_name, u.phone, p.photo, p.occupation,
        (SELECT COUNT(*) FROM contact_shares WHERE from_user_id = ? AND to_user_id = u.id) as sent_req,
        (SELECT COUNT(*) FROM contact_shares WHERE from_user_id = u.id AND to_user_id = ?) as recv_req
        FROM users u
        INNER JOIN profiles p ON u.id = p.user_id
        WHERE u.id IN (
            SELECT i1.to_user_id FROM interests i1
            INNER JOIN interests i2 ON i1.to_user_id = i2.from_user_id AND i1.from_user_id = i2.to_user_id
            WHERE i1.from_user_id = ?
        )";

$stmt = $conn->prepare($sql);
$stmt->bind_param("iii", $my_id, $my_id, $my_id);
$stmt->execute();
$result = $stmt->get_result();

$matches = [];
while ($row = $result->fetch_assoc()) {
    // strict check for visibility
    $sent = $row['sent_req'] > 0;
    $recv = $row['recv_req'] > 0;
    
    if ($sent && $recv) {
        $row['contact_status'] = 'revealed';
        // phone remains visible
    } elseif ($sent) {
        $row['contact_status'] = 'sent';
        $row['phone'] = null; // Hide privacy data
    } elseif ($recv) {
        $row['contact_status'] = 'received';
        $row['phone'] = null; // Hide privacy data
    } else {
        $row['contact_status'] = 'none';
        $row['phone'] = null; // Hide privacy data
    }
    
    // Remove temporary counters from response
    unset($row['sent_req']);
    unset($row['recv_req']);
    
    $matches[] = $row;
}

echo json_encode(['success' => true, 'matches' => $matches]);

$conn->close();
?>
