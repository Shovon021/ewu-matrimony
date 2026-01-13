<?php
// config/db.php

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

// TiDB Cloud requires SSL - use mysqli_real_connect with SSL flag
$conn = mysqli_init();
mysqli_ssl_set($conn, NULL, NULL, NULL, NULL, NULL);
$connected = mysqli_real_connect($conn, $servername, $username, $password, $dbname, $dbport, NULL, MYSQLI_CLIENT_SSL);

// Check connection
if (!$connected || $conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Select database if it exists, otherwise we might be in setup mode
if (empty($skip_db_select)) {
    $conn->select_db($dbname);
}

?>
