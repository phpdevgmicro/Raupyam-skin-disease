<?php 
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);  
error_reporting(E_ALL);

require_once('classes/open-ai.php');
require_once('classes/googleSheet.php');
require_once('classes/mails.php');

// // Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Max-Age: 3600');    
    http_response_code(200); // Respond with HTTP 200 for preflight requests
    exit();
}
// Regular API processing
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, Content-Type"); 
header("Content-Type: application/json; charset=utf-8");

$type = base64_decode($_GET['type']);

if($type == "analysis"){
    if (!isset($_POST['image']) || !isset($_POST['user_detail'])) {
        $show = array("msg" => 'error', 'notice' => 'Missing required fields: image and user_detail');
        echo json_encode($show);
        exit;
    }

    $imageData = str_replace('data:application/octet-stream;base64,', 'data:image/png;base64,', $_POST['image']);
    $user_detail = json_decode($_POST['user_detail'], true);
    
    if (!$user_detail) {
        $show = array("msg" => 'error', 'notice' => 'Invalid user detail format');
        echo json_encode($show);
        exit;
    }

    $air_quality = isset($_POST['air_quality']) ? $_POST['air_quality'] : 'Air quality data not available';

    $prompt = OPENAITOOL::getPrompt(); 
    //$call = OPENAITOOL::visionGpt($imageData, $prompt, "", $air_quality, $user_detail);

    // if($call['status'] == 'error'){
    //     $show = array("msg" => 'error', 'notice'=>$call['msg']);  
    //     echo json_encode($show);
    //     exit;      
    // }

    $call['result'] = 'Tets';

    $mimeType = explode(';', explode(':', $_POST['image'])[1])[0]; 
    $fileName = "analysis_image_" . time() . ".png"; 

    $upload = SHEET::uploadBase64FileToDrive($imageData, $fileName, $mimeType, $call['result'], $user_detail);
   echo 1;
    
    $show = array("msg" => 'success', 'notice'=>$call['msg'], 'result'=>$call['result']);
    echo json_encode($show); 
}

else if($type =='feedback' && $_SERVER['REQUEST_METHOD'] === 'POST'){    
    $rawJson = file_get_contents('php://input');
    $jsonData = json_decode($rawJson, true);

    $call = MAIL::sendEmail($jsonData, 'tweaks');
    if($call["status"] == "error"){
        $show = array("msg" => 'error', 'notice'=>$call['msg']);
    }else{
        $show = array("msg" => 'success', 'notice'=>$call['msg']);
    }   
    echo json_encode($show);
}

?>