<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Default to zero stats (Offline Mode)
$stats = [
    'total_users' => 0,
    'pending_accounts' => 0,
    'verified_users' => 0,
    'pending_biodatas' => 0,
    'verified_biodatas' => 0,
    'total_matches' => 0,
    'total_messages' => 0,
    'recent_registrations' => 0
];

// Manual connection to handle errors gracefully without dying
$db_host_raw = getenv('DB_HOST') ?: "localhost";
$username = getenv('DB_USER') ?: "3EfCaKwRxefFq4w.root";
$password = getenv('DB_PASS') ?: "";
$dbname = getenv('DB_NAME') ?: "ewu_matrimony";

// Parse host and port (TiDB Cloud uses port 4000)
if (strpos($db_host_raw, ':') !== false) {
    list($servername, $dbport) = explode(':', $db_host_raw, 2);
    $dbport = (int)$dbport;
} else {
    $servername = $db_host_raw;
    $dbport = 3306;
}

// Suppress error reporting for connection to avoid leaking HTML errors
error_reporting(0);

// TiDB Cloud requires SSL - use mysqli_real_connect with SSL flag
$conn = mysqli_init();
mysqli_ssl_set($conn, NULL, NULL, NULL, NULL, NULL);
$connected = mysqli_real_connect($conn, $servername, $username, $password, $dbname, $dbport, NULL, MYSQLI_CLIENT_SSL);

error_reporting(E_ALL);

if (!$connected || $conn->connect_error) {
    // Silent fail or return generic error
    echo json_encode(['success' => false, 'error' => 'Database connection failed', 'stats' => []]);
    exit;
}

// DB Connected - Fetch Real Stats
    
    // Total Users
    $res = $conn->query("SELECT COUNT(*) as count FROM users");
    if($res) $stats['total_users'] = (int)$res->fetch_assoc()['count'];

    // Pending Account Verifications
    $res = $conn->query("SELECT COUNT(*) as count FROM users WHERE verification_status = 'pending'");
    if($res) $stats['pending_accounts'] = (int)$res->fetch_assoc()['count'];

    // Verified Users
    $res = $conn->query("SELECT COUNT(*) as count FROM users WHERE verification_status = 'verified'");
    if($res) $stats['verified_users'] = (int)$res->fetch_assoc()['count'];

    // Pending Biodata Verifications
    $res = $conn->query("SELECT COUNT(*) as count FROM profiles WHERE biodata_status = 'pending'");
    if($res) $stats['pending_biodatas'] = (int)$res->fetch_assoc()['count'];

    // Verified Biodatas
    $res = $conn->query("SELECT COUNT(*) as count FROM profiles WHERE biodata_status = 'verified'");
    if($res) $stats['verified_biodatas'] = (int)$res->fetch_assoc()['count'];

    // Total Matches
    $res = $conn->query("SELECT COUNT(*) as count FROM interests WHERE status = 'accepted'"); // Simplified logic
    if($res) $stats['total_matches'] = (int)$res->fetch_assoc()['count'];

    // Total Messages
    $res = $conn->query("SELECT COUNT(*) as count FROM messages");
    if($res) $stats['total_messages'] = (int)$res->fetch_assoc()['count'];

    // Recent Registrations
    $res = $conn->query("SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)");
    if($res) $stats['recent_registrations'] = (int)$res->fetch_assoc()['count'];

    $conn->close();
}

echo json_encode([
    'success' => true,
    'stats' => $stats
]);
?>
