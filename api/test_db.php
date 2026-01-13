<?php
// api/test_db.php
header("Content-Type: text/plain");
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "1. Script started\n";

if (!function_exists('mysqli_init')) {
    die("CRITICAL: mysqli extension not loaded\n");
}
echo "2. mysqli extension exists\n";

$host = getenv('DB_HOST');
$user = getenv('DB_USER');
$pass = getenv('DB_PASS');
$name = getenv('DB_NAME');

echo "3. Env vars: HOST=" . ($host ? "Set" : "Missing") . ", USER=" . ($user ? "Set" : "Missing") . "\n";

$db_host_raw = $host;
if (strpos($db_host_raw, ':') !== false) {
    list($servername, $dbport) = explode(':', $db_host_raw, 2);
    $dbport = (int)$dbport;
} else {
    $servername = $db_host_raw;
    $dbport = 3306;
}

echo "4. Parsed: Host=$servername, Port=$dbport\n";

echo "5. Calling mysqli_init()...\n";
$conn = mysqli_init();
if (!$conn) {
    die("Failed mysqli_init()\n");
}
echo "6. Init success\n";

echo "7. Calling mysqli_ssl_set(NULL...)\n";
// Some environments crash here if openssl missing?
mysqli_ssl_set($conn, NULL, NULL, NULL, NULL, NULL);
echo "8. SSL set success\n";

echo "9. Calling mysqli_real_connect()...\n";
// Note: NOT using @ to allow warnings to show
$connected = mysqli_real_connect($conn, $servername, $user, $pass, $name, $dbport, NULL, MYSQLI_CLIENT_SSL);

if ($connected) {
    echo "10. SUCCESS! Connected to TiDB.\n";
    $conn->close();
} else {
    echo "10. FAILED: " . mysqli_connect_error() . "\n";
    echo "Errno: " . mysqli_connect_errno() . "\n";
}
?>
