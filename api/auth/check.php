<?php
// api/auth/check.php - Check if user is logged in
header('Content-Type: application/json');
session_start();

if (isset($_SESSION['user_id'])) {
    require_once '../../config/db.php';
    
    $stmt = $conn->prepare("SELECT first_name, last_name FROM users WHERE id = ?");
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        echo json_encode([
            'logged_in' => true,
            'user_id' => $_SESSION['user_id'],
            'name' => $user['first_name'] . ' ' . $user['last_name']
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
    $conn->close();
} else {
    echo json_encode(['logged_in' => false]);
}
?>
