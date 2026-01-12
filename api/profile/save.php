<?php
// api/profile/save.php - Simplified to match new schema
header('Content-Type: application/json');
session_start();

require_once '../../config/db.php';
require_once '../../lib/cloudinary.php';

// Check login
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please login first']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$user_id = $_SESSION['user_id'];

// Handle photo upload
$photo_name = null;
if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
    $upload_dir = '../../uploads/';
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0777, true);
    }
    
    $file_ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png'];
    
    if (in_array($file_ext, $allowed)) {
        $uploadResult = uploadFileToCloudinary('photo', 'ewu-matrimony/profiles');
        if ($uploadResult['success']) {
            $photo_name = $uploadResult['url'];
        } else {
            // If upload fails, we might want to error out or continue without photo
            // For now, let's error out to be safe
            echo json_encode(['success' => false, 'message' => 'Photo upload failed: ' . $uploadResult['error']]);
            exit;
        }
    }
}

// Sanitize function
function sanitize($input) {
    if (is_null($input) || $input === '') return null;
    return trim(htmlspecialchars($input, ENT_QUOTES, 'UTF-8'));
}

// Get POST data (matching actual table columns)
$about_me = sanitize($_POST['about_me'] ?? '');
$height = sanitize($_POST['height'] ?? '');
$weight = sanitize($_POST['weight'] ?? '');
$skin_tone = sanitize($_POST['skin_tone'] ?? '');
$blood_group = sanitize($_POST['blood_group'] ?? '');
$marital_status = sanitize($_POST['marital_status'] ?? '');
$education = sanitize($_POST['education'] ?? '');
$occupation = sanitize($_POST['occupation'] ?? '');
$company = sanitize($_POST['company'] ?? '');
$income = sanitize($_POST['income'] ?? '');
$family_type = sanitize($_POST['family_type'] ?? '');
$family_status = sanitize($_POST['family_status'] ?? '');
$father_occupation = sanitize($_POST['father_profession'] ?? '');
$mother_occupation = sanitize($_POST['mother_profession'] ?? '');
$siblings = (int)($_POST['siblings'] ?? 0);
$partner_min_age = (int)($_POST['preferred_age_min'] ?? 18);
$partner_max_age = (int)($_POST['preferred_age_max'] ?? 40);
$partner_min_height = sanitize($_POST['preferred_height'] ?? '');
$partner_religion = sanitize($_POST['partner_religion'] ?? '');
$partner_education = sanitize($_POST['preferred_education'] ?? '');
$partner_occupation = sanitize($_POST['preferred_profession'] ?? '');
$submit_for_verification = ($_POST['submit_for_verification'] ?? '0') === '1';
$biodata_status = $submit_for_verification ? 'pending' : 'pending'; // Always pending for now

// Check if profile exists
$check_sql = "SELECT id, photo FROM profiles WHERE user_id = ?";
$stmt = $conn->prepare($check_sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $existing = $result->fetch_assoc();
    if (!$photo_name) {
        $photo_name = $existing['photo'];
    }
    
    // UPDATE
    $sql = "UPDATE profiles SET 
        photo = ?, about_me = ?, height = ?, weight = ?, skin_tone = ?, blood_group = ?, marital_status = ?,
        education = ?, occupation = ?, company = ?, income = ?, family_type = ?, family_status = ?,
        father_occupation = ?, mother_occupation = ?, siblings = ?,
        partner_min_age = ?, partner_max_age = ?, partner_min_height = ?,
        partner_religion = ?, partner_education = ?, partner_occupation = ?, biodata_status = ?
        WHERE user_id = ?";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'DB Error: ' . $conn->error]);
        exit;
    }
    
    $stmt->bind_param("ssssssssssssssiiiisssssi", 
        $photo_name, $about_me, $height, $weight, $skin_tone, $blood_group, $marital_status,
        $education, $occupation, $company, $income, $family_type, $family_status,
        $father_occupation, $mother_occupation, $siblings,
        $partner_min_age, $partner_max_age, $partner_min_height,
        $partner_religion, $partner_education, $partner_occupation, $biodata_status,
        $user_id
    );
} else {
    // INSERT
    $sql = "INSERT INTO profiles (user_id, photo, about_me, height, weight, skin_tone, blood_group, marital_status,
        education, occupation, company, income, family_type, family_status,
        father_occupation, mother_occupation, siblings,
        partner_min_age, partner_max_age, partner_min_height,
        partner_religion, partner_education, partner_occupation, biodata_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
    
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        echo json_encode(['success' => false, 'message' => 'DB Error: ' . $conn->error]);
        exit;
    }
    
    $stmt->bind_param("isssssssssssssssiiiissss", 
        $user_id, $photo_name, $about_me, $height, $weight, $skin_tone, $blood_group, $marital_status,
        $education, $occupation, $company, $income, $family_type, $family_status,
        $father_occupation, $mother_occupation, $siblings,
        $partner_min_age, $partner_max_age, $partner_min_height,
        $partner_religion, $partner_education, $partner_occupation, $biodata_status
    );
}

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Biodata saved successfully!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Save failed: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
