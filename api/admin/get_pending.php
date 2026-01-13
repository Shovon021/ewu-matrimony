<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Default to empty list
$users = [];

// Manual connection to handle errors gracefully without dying
$db_host_raw = getenv('DB_HOST') ?: "localhost";
$username = getenv('DB_USER') ?: "root";
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

// Suppress error reporting for connection
error_reporting(0);

// TiDB Cloud requires SSL - use mysqli_real_connect with SSL flag
$conn = mysqli_init();
mysqli_ssl_set($conn, NULL, NULL, NULL, NULL, NULL);
$connected = mysqli_real_connect($conn, $servername, $username, $password, $dbname, $dbport, NULL, MYSQLI_CLIENT_SSL);

error_reporting(E_ALL);

if (!$conn->connect_error) {
    // DB Connected - Fetch Data
    $sql = "SELECT `student_id`, `first_name`, `last_name`, `status`, `batch_year`, `id_card_image` FROM `users` WHERE `verification_status` = 'pending'";
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
    }
    $conn->close();
}

echo json_encode($users);
?>
