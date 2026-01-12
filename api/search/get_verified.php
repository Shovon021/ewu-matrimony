<?php
// api/search/get_verified.php
// Returns all verified biodatas for public search
header('Content-Type: application/json');

require_once '../../config/db.php';

// Get filter parameters (optional)
$gender = $_GET['gender'] ?? '';
$religion = $_GET['religion'] ?? '';
$min_age = (int)($_GET['min_age'] ?? 18);
$max_age = (int)($_GET['max_age'] ?? 60);

// Build query - simplified to match actual table columns
$sql = "SELECT 
    u.id, u.first_name, u.last_name, u.gender, u.dob, u.religion, u.status as student_status, u.batch_year,
    p.photo, p.about_me, p.height, p.occupation, p.education, p.skin_tone,
    TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age
    FROM users u
    INNER JOIN profiles p ON u.id = p.user_id
    WHERE u.verification_status = 'verified' 
    AND p.biodata_status = 'verified'";

$params = [];
$types = "";

if ($gender) {
    $sql .= " AND u.gender = ?";
    $params[] = $gender;
    $types .= "s";
}

if ($religion) {
    $sql .= " AND u.religion = ?";
    $params[] = $religion;
    $types .= "s";
}

$sql .= " HAVING age BETWEEN ? AND ? ORDER BY p.updated_at DESC";
$params[] = $min_age;
$params[] = $max_age;
$types .= "ii";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(['success' => false, 'error' => $conn->error]);
    exit;
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$profiles = [];
while ($row = $result->fetch_assoc()) {
    $profiles[] = $row;
}

echo json_encode($profiles);

$stmt->close();
$conn->close();
?>
