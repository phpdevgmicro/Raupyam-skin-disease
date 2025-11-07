<?php require_once($_SERVER['DOCUMENT_ROOT']."/sheetGPT/library/vendor/autoload.php");
use Google\Client;
use Google\Service\Drive;
use Google\Service\Sheets\SpreadSheet;

class SHEET {
   public static $data;      

    public static function appendSheet($data){ 
        try {    
            $client = new Client();
            $client->setAuthConfig('./smart-athlete-385708-1eb41fe68b00.json');
            $client->addScope(Drive::DRIVE);            
            $service = new Google_Service_Sheets($client);
            $spreadsheetId = '1PloIde_aQWGZ5QcnqX3LrC2pl_1B4j92-ida4ZSZKD8'; 
            
            $body = new Google_Service_Sheets_ValueRange([
                'values' => [$data]
            ]);
            $params = [
                'valueInputOption' => "RAW"
            ];
            $range = "Sheet1!A:D"; // Adjust the range based on your columns
            
            $result = $service->spreadsheets_values->append($spreadsheetId, $range, $body, $params);
            
            $response = array('updatedRange' => $result->updates->updatedRange);
            
            $data = array('status'=>'success', 'msg'=>"Data appended successfully", 'result'=>$response);
        } catch (Exception $e) {
            $data = array('status'=>'error', 'msg'=>$e->getMessage());
        } finally {
            return $data;
        }       
    }

    // public static function uploadBase64FileToDrive($base64Data, $fileName, $mimeType, $analysisData, $userData){ 
    //     try {    

    //          echo"<pre>";print_r($base64Data );
              

    //         // Decode base64 data directly from memory (no temp file)
    //         $data = explode(',', $base64Data);
    //         $decodedData = base64_decode($data[1]);
            
    //         // Initialize Google Client
    //         $client = new Client();
    //         $client->setAuthConfig('./smart-athlete-385708-1eb41fe68b00.json');
    //         $client->addScope(Drive::DRIVE_FILE);
            
    //         $service = new Google_Service_Drive($client);
            
    //         $file = new Google_Service_Drive_DriveFile();
    //         $file->setName($fileName);
    //         $file->setParents(['1e4ZSFXyWKabOnY797E--zaNZqJuYaeoL']);
            
    //         // Upload directly from memory without temp file
    //         $result = $service->files->create($file, [
    //             'data' => $decodedData,
    //             'mimeType' => $mimeType,
    //             'uploadType' => 'multipart',
    //             'fields' => 'id'
    //         ]);

    //          echo"<pre>";print_r($result );
            
    //         $fileId = $result->id;
    //         echo $fileUrl = "https://drive.google.com/file/d/" . $fileId . "/view";

    //         //  // Append file URL to Google Sheet                 
    //         // self::appendSheet([
    //         //     $userData['fullName'] ?? '',
    //         //     $userData['age'] ?? '',
    //         //     $userData['gender'] ?? '',
    //         //     $userData['city'] ?? '',
    //         //     $userData['state'] ?? '',
    //         //     $userData['country'] ?? '',
    //         //     $userData['skinType'] ?? '',
    //         //     $fileName, 
    //         //     date('Y-m-d H:i:s'), 
    //         //     $fileUrl,
    //         //     $analysisData
    //         // ]);
            
    //         $data = array('status'=>'success', 'msg'=>"File uploaded and URL stored in sheet", 'fileUrl'=>$fileUrl);
    //     } catch (Exception $e) {
    //         $data = array('status'=>'error', 'msg'=>$e->getMessage());
    //     } finally {
    //         return $data;
    //     }       
    // }

public static function uploadBase64FileToDrive($base64Data, $fileName, $mimeType, $analysisData, $userData){ 
    try {    
        // Debug: Check incoming data
        error_log("=== UPLOAD DEBUG START ===");
        error_log("Filename: " . $fileName);
        error_log("MIME Type: " . $mimeType);
        error_log("Base64 length: " . strlen($base64Data));
        error_log("Base64 preview: " . substr($base64Data, 0, 100));
        
        // Validate base64 data
        if (empty($base64Data)) {
            throw new Exception('Base64 data is empty');
        }
        
        // Decode base64 data
        $data = explode(',', $base64Data);
        error_log("Exploded parts count: " . count($data));
        
        if (count($data) < 2) {
            // No comma found, maybe it's raw base64 without data URI
            error_log("No comma found, treating as raw base64");
            $decodedData = base64_decode($base64Data, true);
        } else {
            error_log("Data URI found, extracting base64 part");
            $decodedData = base64_decode($data[1], true);
        }
        
        // Validate decoded data
        if ($decodedData === false) {
            throw new Exception('Failed to decode base64 data');
        }
        
        $decodedSize = strlen($decodedData);
        error_log("Decoded data size: " . number_format($decodedSize) . " bytes");
        
        if ($decodedSize == 0) {
            throw new Exception('Decoded data is empty');
        }
        
        // Check file size limit (10MB)
        $maxSize = 10 * 1024 * 1024;
        if ($decodedSize > $maxSize) {
            throw new Exception('File size exceeds 10MB limit');
        }
        
        // Check if service account file exists
        $serviceAccountPath = './smart-athlete-385708-1eb41fe68b00.json';
        if (!file_exists($serviceAccountPath)) {
            throw new Exception('Service account file not found at: ' . $serviceAccountPath);
        }
        
        error_log("Service account file found");
        
        // Initialize Google Client
        $client = new Client();
        $client->setAuthConfig($serviceAccountPath);
        $client->addScope(Drive::DRIVE_FILE);
        
        error_log("Google Client initialized");
        
        $service = new Google_Service_Drive($client);
        
        // Create file metadata
        $file = new Google_Service_Drive_DriveFile();
        $file->setName($fileName);
        $file->setParents(['1e4ZSFXyWKabOnY797E--zaNZqJuYaeoL']);
        
        error_log("Starting file upload to Google Drive...");
        
        // Upload directly from memory without temp file
        $result = $service->files->create($file, [
            'data' => $decodedData,
            'mimeType' => $mimeType,
            'uploadType' => 'multipart',
            'fields' => 'id, name, mimeType, size'
        ]);
        
        error_log("Upload completed!");
        error_log("File ID: " . $result->id);
        error_log("File Name: " . $result->name);
        
        $fileId = $result->id;
        $fileUrl = "https://drive.google.com/file/d/" . $fileId . "/view";
        
        error_log("File URL: " . $fileUrl);
        
        // Append file URL to Google Sheet
        try {
            error_log("Appending to sheet...");
            self::appendSheet([
                $userData['fullName'] ?? '',
                $userData['age'] ?? '',
                $userData['gender'] ?? '',
                $userData['city'] ?? '',
                $userData['state'] ?? '',
                $userData['country'] ?? '',
                $userData['skinType'] ?? '',
                $fileName, 
                date('Y-m-d H:i:s'), 
                $fileUrl,
                $analysisData
            ]);
            error_log("Sheet append successful");
        } catch (Exception $sheetError) {
            error_log("Sheet append failed: " . $sheetError->getMessage());
            // Don't fail the upload, just log it
        }
        
        error_log("=== UPLOAD DEBUG END ===");
        
        $data = array(
            'status' => 'success', 
            'msg' => "File uploaded and URL stored in sheet", 
            'fileUrl' => $fileUrl,
            'fileId' => $fileId
        );
        
    } catch (Exception $e) {
        error_log("=== UPLOAD ERROR ===");
        error_log("Error: " . $e->getMessage());
        error_log("File: " . $e->getFile());
        error_log("Line: " . $e->getLine());
        error_log("Trace: " . $e->getTraceAsString());
        
        $data = array(
            'status' => 'error', 
            'msg' => $e->getMessage(),
            'debug' => [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]
        );
    }
    
    return $data;
}


}