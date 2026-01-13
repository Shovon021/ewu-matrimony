<?php
// Enable CORS
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$student_id = $_GET['student_id'] ?? '';

if (empty($student_id)) {
    echo json_encode(['success' => false, 'message' => 'Student ID required']);
    exit;
}

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
$conn = new mysqli($servername, $username, $password, $dbname, $dbport);
error_reporting(E_ALL);

if ($conn->connect_error) {
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit;
}

// DB Connected - Fetch Data
$sql = "SELECT 
    u.student_id, u.first_name, u.last_name, u.email, u.phone, u.gender, u.dob, u.religion, u.batch_year, u.status as student_status,
    p.*
    FROM users u
    INNER JOIN profiles p ON u.id = p.user_id
    WHERE u.student_id = ?";

$stmt = $conn->prepare($sql);

if ($stmt) {
    $stmt->bind_param("s", $student_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $data = $result->fetch_assoc();
        echo json_encode(['success' => true, 'data' => $data]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Biodata not found']);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'message' => 'Query preparation failed']);
}

$conn->close();
?>
