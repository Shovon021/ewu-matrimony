<?php
// api/auth/register.php - With Input Sanitization
header('Content-Type: application/json');

require_once '../../config/db.php';
require_once '../../lib/cloudinary.php';

// Check if request is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// =====================================================
// INPUT SANITIZATION
// =====================================================
function sanitize($input) {
    return trim(htmlspecialchars($input, ENT_QUOTES, 'UTF-8'));
}

$student_id = sanitize($_POST['studentId'] ?? '');
$first_name = sanitize($_POST['firstName'] ?? '');
$last_name = sanitize($_POST['lastName'] ?? '');
$password = $_POST['password'] ?? ''; // Don't sanitize password before hashing
$gender = sanitize($_POST['gender'] ?? '');
$dob = sanitize($_POST['dob'] ?? '');
$phone = sanitize($_POST['phone'] ?? '');
$religion = sanitize($_POST['religion'] ?? '');
$status = sanitize($_POST['status'] ?? '');
$batch = sanitize($_POST['batch'] ?? '');

// =====================================================
// VALIDATION
// =====================================================
$errors = [];

// Required fields
if (empty($student_id)) $errors[] = 'Student ID is required';
if (empty($first_name)) $errors[] = 'First name is required';
if (empty($password)) $errors[] = 'Password is required';
if (empty($gender)) $errors[] = 'Gender is required';
if (empty($phone)) $errors[] = 'Phone is required';

// Student ID format (YYYY-N-NN-NNN)
if (!empty($student_id) && !preg_match('/^[0-9]{4}-[0-9]-[0-9]{2}-[0-9]{3}$/', $student_id)) {
    $errors[] = 'Invalid Student ID format (expected: YYYY-N-NN-NNN)';
}

// Password strength
if (strlen($password) < 6) {
    $errors[] = 'Password must be at least 6 characters';
}

// Phone validation (Bangladesh format)
if (!empty($phone) && !preg_match('/^01[0-9]{9}$/', $phone)) {
    $errors[] = 'Invalid phone format (expected: 01XXXXXXXXX)';
}

// Name validation (letters only)
if (!empty($first_name) && !preg_match('/^[a-zA-Z\s]+$/', $first_name)) {
    $errors[] = 'First name should contain only letters';
}

// Gender validation
if (!empty($gender) && !in_array($gender, ['male', 'female'])) {
    $errors[] = 'Invalid gender value';
}

// Status validation
if (!empty($status) && !in_array($status, ['undergraduate', 'graduate', 'alumni'])) {
    $errors[] = 'Invalid status value';
}

if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(', ', $errors), 'errors' => $errors]);
    exit;
}

// =====================================================
// CHECK DUPLICATE
// =====================================================
$check_sql = "SELECT id FROM users WHERE student_id = ?";
$stmt = $conn->prepare($check_sql);
$stmt->bind_param("s", $student_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(['success' => false, 'message' => 'Student ID already registered']);
    exit;
}

// =====================================================
// HANDLE FILE UPLOAD
// =====================================================
$id_card_image = null;
if (isset($_FILES['id_card']) && $_FILES['id_card']['error'] === UPLOAD_ERR_OK) {
    $upload_dir = '../../uploads/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    $file_ext = strtolower(pathinfo($_FILES['id_card']['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'pdf'];
    
    if (in_array($file_ext, $allowed)) {
        // Cloudinary upload
        $uploadResult = uploadFileToCloudinary('id_card', 'ewu-matrimony/id-cards');
        
        if ($uploadResult['success']) {
            $id_card_image = $uploadResult['url'];
        } else {
            echo json_encode(['success' => false, 'message' => 'Upload failed: ' . $uploadResult['error']]);
            exit;
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Invalid file type. Only JPG, PNG, PDF allowed']);
        exit;
    }
} else {
    // Ideally make it required, but for now let's allow optional (or return error if strict)
    // $errors[] = "ID Card upload is required"; 
}

// =====================================================
// INSERT USER
// =====================================================
$hashed_password = password_hash($password, PASSWORD_DEFAULT);
$email = $student_id . "@std.ewubd.edu"; 

// Using database default for verification_status ('pending') if not specified in column list, 
// but we do specifiy params. 
// Note: We need to match the column count exactly.
// Updated query to include id_card_image

$insert_sql = "INSERT INTO users (student_id, first_name, last_name, email, password, gender, dob, phone, religion, status, batch_year, id_card_image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($insert_sql);

if (!$stmt) {
    error_log("Prepare failed: " . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $conn->error]);
    exit;
}

$stmt->bind_param("ssssssssssss", $student_id, $first_name, $last_name, $email, $hashed_password, $gender, $dob, $phone, $religion, $status, $batch, $id_card_image);

if ($stmt->execute()) {
    echo json_encode([
        'success' => true, 
        'message' => 'Account created! Please wait for admin verification before logging in.'
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
}

$stmt->close();
$conn->close();
?>
