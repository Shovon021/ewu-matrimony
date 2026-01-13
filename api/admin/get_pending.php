<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Default to empty list
$users = [];

// Manual connection to handle errors gracefully without dying
$servername = getenv('DB_HOST') ?: "localhost";
$username = getenv('DB_USER') ?: "root";
$password = getenv('DB_PASS') ?: "";
$dbname = getenv('DB_NAME') ?: "ewu_matrimony";

// Suppress error reporting for connection
error_reporting(0);
$conn = new mysqli($servername, $username, $password, $dbname);
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
