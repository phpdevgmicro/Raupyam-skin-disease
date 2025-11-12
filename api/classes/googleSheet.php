<?php 
require_once(__DIR__ . '/../../vendor/autoload.php');
use Google\Client;
use Google\Service\Drive;
use Google\Service\Sheets\SpreadSheet;
use Google\Service\Drive\DriveFile;
use Google\Http\MediaFileUpload;

class SHEET {
    public static $data;
    
    // Optimize: Cache client instance to avoid recreating it
    private static $clientInstance = null;
    
    private static function getClient($scope = Drive::DRIVE) {
        if (self::$clientInstance === null) {
            self::$clientInstance = new Client();
            self::$clientInstance->setAuthConfig('./creds.json');
        }
        
        // Only add scope if not already added
        $existingScopes = self::$clientInstance->getScopes();
        if (!in_array($scope, $existingScopes)) {
            self::$clientInstance->addScope($scope);
        }
        
        return self::$clientInstance;
    }
    
    public static function appendSheet($data) { 
        try {
            $client = self::getClient(Drive::DRIVE);
            $service = new Google_Service_Sheets($client);
            $spreadsheetId = '1PloIde_aQWGZ5QcnqX3LrC2pl_1B4j92-ida4ZSZKD8';
            
            $body = new Google_Service_Sheets_ValueRange([
                'values' => [$data]
            ]);
            
            $params = ['valueInputOption' => "RAW"];
            $range = "Sheet1!A:L";
            
            $result = $service->spreadsheets_values->append(
                $spreadsheetId, 
                $range, 
                $body, 
                $params
            );
            
            return [
                'status' => 'success', 
                'msg' => "Data appended successfully", 
                'result' => ['updatedRange' => $result->updates->updatedRange]
            ];
            
        } catch (Exception $e) {
            return ['status' => 'error', 'msg' => $e->getMessage()];
        }
    }
    
    /**
     * Optimized: Uploads base64 file to Google Drive with improved performance
     */
    public static function uploadBase64FileToDrive($base64Data, $fileName, $mimeType, $analysisData, $userData) {
        $folderId = '1e4ZSFXyWKabOnY797E--zaNZqJuYaeoL';
        $tempStream = null;
        
        try {
            // Optimize: Extract and decode base64 more efficiently
            $base64Content = (strpos($base64Data, ',') !== false) 
                ? substr($base64Data, strpos($base64Data, ',') + 1) 
                : $base64Data;
            
            // Optimize: Decode with strict mode
            $binaryData = base64_decode($base64Content, true);
            if ($binaryData === false) {
                throw new \Exception("Invalid base64 data");
            }
            
            $decodedSize = strlen($binaryData);
            
            // Optimize: Only create stream if file is large enough to benefit
            // For small files (< 1MB), use direct upload
            if ($decodedSize < 1048576) { // 1MB
                return self::uploadSmallFile($binaryData, $fileName, $mimeType, $folderId);
            }
            
            // For larger files, use chunked upload
            $tempStream = fopen('php://temp', 'r+');
            fwrite($tempStream, $binaryData);
            rewind($tempStream);
            
            $client = self::getClient(Drive::DRIVE_FILE);
            $service = new Google_Service_Drive($client);
            
            $fileMetadata = new DriveFile([
                'name' => $fileName,
                'parents' => [$folderId]
            ]);
            
            $client->setDefer(true);
            
            $request = $service->files->create($fileMetadata, [
                'supportsAllDrives' => true
            ]);
            
            // Optimize: Use larger chunk size for faster uploads (2MB instead of 1MB)
            $chunkSize = 2 * 1024 * 1024;
            $media = new MediaFileUpload(
                $client,
                $request,
                $mimeType,
                null,
                true,
                $chunkSize
            );
            $media->setFileSize($decodedSize);
            
            $status = false;
            
            while (!feof($tempStream)) {
                $chunk = fread($tempStream, $chunkSize);
                
                if ($chunk === false) {
                    throw new \Exception("Failed to read chunk from stream");
                }
                
                if (empty($chunk)) {
                    break;
                }
                
                $status = $media->nextChunk($chunk);
                
                if (is_object($status)) {
                    break;
                }
            }
            
            $client->setDefer(false);
            
            if ($status && is_object($status) && property_exists($status, 'id')) {
                $fileId = $status->id;
                $fileUrl = "https://drive.google.com/file/d/" . $fileId . "/view";
                
                return [
                    'status' => 'success',
                    'msg' => 'File uploaded successfully',
                    'fileUrl' => $fileUrl,
                    'fileId' => $fileId
                ];
            } else {
                throw new \Exception("Upload failed to finalize");
            }
            
        } catch (Exception $e) {
            return ['status' => 'error', 'msg' => $e->getMessage()];
        } finally {
            if ($tempStream && is_resource($tempStream)) {
                fclose($tempStream);
            }
        }
    }
    
    /**
     * Optimize: Direct upload for small files (< 1MB) - much faster
     */
    private static function uploadSmallFile($binaryData, $fileName, $mimeType, $folderId) {
        try {
            $client = self::getClient(Drive::DRIVE_FILE);
            $service = new Google_Service_Drive($client);
            
            $fileMetadata = new DriveFile([
                'name' => $fileName,
                'parents' => [$folderId]
            ]);
            
            // Direct upload without chunking
            $file = $service->files->create(
                $fileMetadata,
                [
                    'data' => $binaryData,
                    'mimeType' => $mimeType,
                    'uploadType' => 'multipart',
                    'supportsAllDrives' => true
                ]
            );
            
            $fileUrl = "https://drive.google.com/file/d/" . $file->id . "/view";
            
            return [
                'status' => 'success',
                'msg' => 'File uploaded successfully',
                'fileUrl' => $fileUrl,
                'fileId' => $file->id
            ];
            
        } catch (Exception $e) {
            return ['status' => 'error', 'msg' => $e->getMessage()];
        }
    }
}