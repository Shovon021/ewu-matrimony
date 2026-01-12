<?php
// api/admin/stats.php - Get real dashboard statistics
header('Content-Type: application/json');

require_once '../../config/db.php';

session_start();
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Total Users
$total_users_result = $conn->query("SELECT COUNT(*) as count FROM users");
$total_users = $total_users_result->fetch_assoc()['count'];

// Pending Account Verifications
$pending_accounts_result = $conn->query("SELECT COUNT(*) as count FROM users WHERE verification_status = 'pending'");
$pending_accounts = $pending_accounts_result->fetch_assoc()['count'];

// Verified Users
$verified_users_result = $conn->query("SELECT COUNT(*) as count FROM users WHERE verification_status = 'verified'");
$verified_users = $verified_users_result->fetch_assoc()['count'];

// Pending Biodata Verifications
$pending_biodatas_result = $conn->query("SELECT COUNT(*) as count FROM profiles WHERE biodata_status = 'pending'");
$pending_biodatas = $pending_biodatas_result->fetch_assoc()['count'];

// Verified Biodatas (published profiles)
$verified_biodatas_result = $conn->query("SELECT COUNT(*) as count FROM profiles WHERE biodata_status = 'verified'");
$verified_biodatas = $verified_biodatas_result->fetch_assoc()['count'];

// Total Matches (mutual interests)
$matches_result = $conn->query("
    SELECT COUNT(*) as count FROM interests i1
    INNER JOIN interests i2 ON i1.to_user_id = i2.from_user_id AND i1.from_user_id = i2.to_user_id
    WHERE i1.id < i2.id
");
$total_matches = $matches_result->fetch_assoc()['count'];

// Total Messages
$messages_result = $conn->query("SELECT COUNT(*) as count FROM messages");
$total_messages = $messages_result->fetch_assoc()['count'];

// Recent Registrations (last 7 days)
$recent_result = $conn->query("SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
$recent_registrations = $recent_result->fetch_assoc()['count'];

echo json_encode([
    'success' => true,
    'stats' => [
        'total_users' => (int)$total_users,
        'pending_accounts' => (int)$pending_accounts,
        'verified_users' => (int)$verified_users,
        'pending_biodatas' => (int)$pending_biodatas,
        'verified_biodatas' => (int)$verified_biodatas,
        'total_matches' => (int)$total_matches,
        'total_messages' => (int)$total_messages,
        'recent_registrations' => (int)$recent_registrations
    ]
]);

$conn->close();
?>
