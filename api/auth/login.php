<?php
// api/auth/login.php - With Rate Limiting & Input Sanitization
header('Content-Type: application/json');
session_start();

require_once '../../config/db.php';

// =====================================================
// RATE LIMITING - Max 5 attempts per 15 minutes
// =====================================================
$rate_limit_key = 'login_attempts_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$max_attempts = 5;
$lockout_time = 15 * 60; // 15 minutes in seconds

if (!isset($_SESSION['rate_limit'])) {
    $_SESSION['rate_limit'] = [];
}

// Clean old attempts
if (isset($_SESSION['rate_limit'][$rate_limit_key])) {
    $_SESSION['rate_limit'][$rate_limit_key] = array_filter(
        $_SESSION['rate_limit'][$rate_limit_key],
        fn($time) => $time > (time() - $lockout_time)
    );
}

// Check if locked out
$attempts = $_SESSION['rate_limit'][$rate_limit_key] ?? [];
if (count($attempts) >= $max_attempts) {
    $oldest = min($attempts);
    $wait_time = ceil(($oldest + $lockout_time - time()) / 60);
    echo json_encode([
        'success' => false, 
        'message' => "Too many failed attempts. Please try again in {$wait_time} minutes.",
        'locked' => true
    ]);
    exit;
}

// =====================================================
// INPUT VALIDATION
// =====================================================
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// Sanitize inputs
$student_id = trim(htmlspecialchars($_POST['studentId'] ?? '', ENT_QUOTES, 'UTF-8'));
$password = $_POST['password'] ?? '';

if (empty($student_id) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Student ID and Password are required']);
    exit;
}

// Validate student ID format (basic check)
if (!preg_match('/^[0-9]{4}-[0-9]-[0-9]{2}-[0-9]{3}$/', $student_id) && !preg_match('/^[a-zA-Z0-9]+$/', $student_id)) {
    echo json_encode(['success' => false, 'message' => 'Invalid Student ID format']);
    exit;
}

// =====================================================
// AUTHENTICATION
// =====================================================
$sql = "SELECT id, first_name, password, verification_status FROM users WHERE student_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    
    // Verify Password
    if (password_verify($password, $user['password'])) {
        
        // CHECK: Verification Status
        if ($user['verification_status'] === 'pending') {
            echo json_encode([
                'success' => false, 
                'message' => 'Your account is pending verification. Please wait for admin approval.',
                'status' => 'pending'
            ]);
            exit;
        }
        
        if ($user['verification_status'] === 'rejected') {
            echo json_encode([
                'success' => false, 
                'message' => 'Your account was rejected. Please contact support.',
                'status' => 'rejected'
            ]);
            exit;
        }

        // Clear rate limit on successful login
        unset($_SESSION['rate_limit'][$rate_limit_key]);

        // Login Success - Set session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['first_name'];
        $_SESSION['login_time'] = time();

        echo json_encode([
            'success' => true,
            'message' => 'Login successful!',
            'user' => [
                'name' => $user['first_name'],
                'student_id' => $student_id
            ]
        ]);
    } else {
        // Record failed attempt
        $_SESSION['rate_limit'][$rate_limit_key][] = time();
        $remaining = $max_attempts - count($_SESSION['rate_limit'][$rate_limit_key]);
        
        echo json_encode([
            'success' => false, 
            'message' => "Invalid password. {$remaining} attempts remaining."
        ]);
    }
} else {
    // Record failed attempt (user not found)
    $_SESSION['rate_limit'][$rate_limit_key][] = time();
    $remaining = $max_attempts - count($_SESSION['rate_limit'][$rate_limit_key]);
    
    echo json_encode([
        'success' => false, 
        'message' => "User not found. {$remaining} attempts remaining."
    ]);
}

$stmt->close();
$conn->close();
?>
