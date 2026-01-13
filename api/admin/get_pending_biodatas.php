<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Default to empty list
$biodatas = [];

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

// Suppress error reporting for connection
error_reporting(0);

// TiDB Cloud requires SSL - use mysqli_real_connect with SSL flag
$conn = mysqli_init();
mysqli_ssl_set($conn, NULL, NULL, NULL, NULL, NULL);
$connected = mysqli_real_connect($conn, $servername, $username, $password, $dbname, $dbport, NULL, MYSQLI_CLIENT_SSL);

error_reporting(E_ALL);

if (!$conn->connect_error) {
    // DB Connected - Fetch Data
    $sql = "SELECT 
        u.student_id, u.first_name, u.last_name, u.gender, u.batch_year, u.status as student_status,
        p.photo, p.occupation, p.biodata_status, p.updated_at
        FROM users u
        INNER JOIN profiles p ON u.id = p.user_id
        WHERE p.biodata_status = 'pending'
        ORDER BY p.updated_at ASC";
        
    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $biodatas[] = $row;
        }
    }
    $conn->close();
}

echo json_encode($biodatas);
?>
