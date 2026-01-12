<?php
// api/public/stats.php - Public statistics for the landing page
header('Content-Type: application/json');
require_once '../../config/db.php';

try {
    // 1. Total EWU Members (All Users)
    $users_result = $conn->query("SELECT COUNT(*) as count FROM users");
    $total_users = $users_result->fetch_assoc()['count'];
    
    // 2. Successful Matches (Mutual Interests)
    $matches_result = $conn->query("
        SELECT COUNT(*) as count FROM interests i1
        INNER JOIN interests i2 ON i1.to_user_id = i2.from_user_id AND i1.from_user_id = i2.to_user_id
        WHERE i1.id < i2.id
    ");
    $matches = $matches_result->fetch_assoc()['count'];

    // 3. Departments (Static for now)
    $departments = 15;

    // 4. Satisfaction (Static marketing number)
    $satisfaction = 98;

    echo json_encode([
        'success' => true,
        'data' => [
            'members' => $total_users,
            'matches' => $matches,
            'departments' => $departments,
            'satisfaction' => $satisfaction
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error fetching stats']);
}
