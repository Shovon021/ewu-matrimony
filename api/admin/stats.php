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
$servername = getenv('DB_HOST') ?: "localhost";
$username = getenv('DB_USER') ?: "root";
$password = getenv('DB_PASS') ?: "";
$dbname = getenv('DB_NAME') ?: "ewu_matrimony";

// Suppress error reporting for connection to avoid leaking HTML errors
error_reporting(0);
$conn = new mysqli($servername, $username, $password, $dbname);
error_reporting(E_ALL);

if (!$conn->connect_error) {
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
