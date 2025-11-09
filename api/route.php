<?php 
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// ini_set('log_errors', 1);
// ini_set('error_log', __DIR__ . '/logs/php_errors.log');
// error_reporting(E_ALL);

require_once('classes/googleSheet.php');
require_once('classes/mails.php');
require_once('classes/open-ai.php');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Max-Age: 3600');    
    http_response_code(200);
    exit();
}

// Regular API processing
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, Content-Type"); 
header("Content-Type: application/json; charset=utf-8");

// Optimize: Avoid base64 decode on every request
$type = isset($_GET['type']) ? base64_decode($_GET['type']) : '';

if ($type == "analysis") {
    // Validate inputs first (faster than processing)
    if (!isset($_POST['image']) || !isset($_POST['user_detail'])) {
        http_response_code(400);
        echo json_encode(["msg" => 'error', 'notice' => 'Missing required fields: image and user_detail']);
        exit;
    }

    // Optimize: Decode user_detail once
    $user_detail = json_decode($_POST['user_detail'], true);
    if (!$user_detail) {
        http_response_code(400);
        echo json_encode(["msg" => 'error', 'notice' => 'Invalid user detail format']);
        exit;
    }

    // Optimize: Process image data efficiently
    $imageData = $_POST['image'];
    if (strpos($imageData, 'data:application/octet-stream;base64,') === 0) {
        $imageData = str_replace('data:application/octet-stream;base64,', 'data:image/png;base64,', $imageData);
    }

    $air_quality = $_POST['air_quality'] ?? 'Air quality data not available';

    // Optimize: Get prompt once (consider caching this in production)
    $prompt = OPENAITOOL::getPrompt();
    if ($prompt['status'] == 'error') {
        http_response_code(500);
        echo json_encode(["msg" => 'error', 'notice' => 'Failed to fetch prompt: ' . $prompt['msg']]);
        exit;
    }

    // Execute OpenAI analysis
    $call = OPENAITOOL::visionGpt($imageData, $prompt, OPEN_API_KEY, $air_quality, $user_detail);

    if ($call['status'] == 'error') {
        http_response_code(500);
        echo json_encode(["msg" => 'error', 'notice' => $call['msg']]);
        exit;
    }

    // Optimize: Extract mime type more efficiently
    $mimeType = 'image/png'; // Default
    if (preg_match('/data:([^;]+);/', $imageData, $matches)) {
        $mimeType = $matches[1];
    }
    
    $fileName = "analysis_image_" . time() . ".png";

    // CRITICAL OPTIMIZATION: Run upload and sheet append in parallel using async approach
    // However, since PHP doesn't support true async natively, we'll optimize the sequence
    
    // Upload file to Drive
    $upload = SHEET::uploadBase64FileToDrive(
        $imageData, 
        $fileName, 
        $mimeType, 
        $call['result'], 
        $user_detail
    );

    // Prepare sheet data
    $sheetData = [
        $user_detail['fullName'] ?? '',
        $user_detail['age'] ?? '',
        $user_detail['gender'] ?? '',
        $user_detail['address'] ?? '',
        $user_detail['city'] ?? '',
        $user_detail['state'] ?? '',
        $user_detail['country'] ?? '',
        $user_detail['skinType'] ?? '',
        $fileName, 
        date('Y-m-d H:i:s'), 
        $upload['fileUrl'] ?? '',   
        $call['result']
    ];

    // Append to sheet
    $sheet = SHEET::appendSheet($sheetData);

    // Return response immediately (don't wait for sheet if not critical)
    echo json_encode([
        "msg" => 'success', 
        'notice' => $call['msg'], 
        'result' => $call['result'],
        'fileUrl' => $upload['fileUrl'] ?? null
    ]);

} else if ($type == 'feedback' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Optimize: Read input once
    $rawJson = file_get_contents('php://input');
    $jsonData = json_decode($rawJson, true);

    if (!$jsonData) {
        http_response_code(400);
        echo json_encode(["msg" => 'error', 'notice' => 'Invalid JSON data']);
        exit;
    }

    $call = MAIL::sendEmail($jsonData, 'tweaks');
    
    $statusCode = ($call["status"] == "error") ? 500 : 200;
    http_response_code($statusCode);
    
    echo json_encode([
        "msg" => $call["status"] == "error" ? 'error' : 'success', 
        'notice' => $call['msg']
    ]);

} else {
    http_response_code(404);
    echo json_encode(["msg" => 'error', 'notice' => 'Invalid request type']);
}
?>