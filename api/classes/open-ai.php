<?php 
require_once("config.php");

class OPENAITOOL {
    public static $data;
    
    // Optimize: Cache prompts to avoid DB queries on every request
    private static $promptCache = null;
    private static $promptCacheTime = 0;
    private static $promptCacheTTL = 3600; // 1 hour cache
    
    public static function visionGpt($image, $prompt, $accessToken, $airQuality, $userData) {
        try {
            if (!isset($prompt['result']['vision'])) {
                throw new \Exception('Vision prompt not found');
            }
            
            $instruction = $prompt['result']['vision'];
            
            // Build JSON-based user text for better flexibility
            $jsonData = [
                'airQuality' => $airQuality,
                'userData' => $userData
            ];
            
            $text = "Air Quality Data:\n" . $airQuality . "\n\nUser Data (JSON):\n" . json_encode($userData, JSON_PRETTY_PRINT);
            
            // Optimize: Only log if logging is enabled (check first to avoid I/O)
            if (defined('ENABLE_LOGGING') && ENABLE_LOGGING) {
                $logFile = 'logs/vision_gpt_' . date('Y-m-d') . '.log';
                file_put_contents(
                    $logFile, 
                    "User Text Data:\n" . $text . "\n\n", 
                    FILE_APPEND | LOCK_EX
                );
            }
            
            // Optimize: Build request payload efficiently
            $payload = [
                "model" => "gpt-5-mini",
                "input" => [
                    ['role' => 'developer', 'content' => $instruction],
                    ['role' => 'user',
                        'content' => [
                            ['type' => 'input_text', 'text' => $text],
                            ['type' => 'input_image', 'image_url' => $image],
							['type' => 'input_text',  'text'=>  "IMPORTANT: 
1. Parse the User Data JSON to extract relevant information (age, gender, skinType, topConcern, etc.). Handle missing/null values gracefully.
2. Use both air quality data and user data to personalize your analysis.
3. Format your response using HTML tags for proper structure:
   - Use <h2> for main section headings
   - Use <h3> for sub-section headings
   - Use <p> for paragraphs
   - Use <ul> and <li> for lists
   - Use <strong> for emphasis
   - Use <small> for secondary information
   - Use <br> for line breaks when needed
4. Structure your response with clear HTML formatting to make it easy to read and understand."
							],
                        ]
                    ]
                ],
                "max_output_tokens" => 2000
            ];
            
            // Optimize: Use more efficient curl options
            $ch = curl_init("https://api.openai.com/v1/responses");
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_HTTPHEADER => [
                    "Content-Type: application/json",
                    "Authorization: Bearer " . $accessToken
                ],
                CURLOPT_TIMEOUT => 60, // Set reasonable timeout
                CURLOPT_CONNECTTIMEOUT => 10, // Connection timeout
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0, // Use HTTP/2 if available
                CURLOPT_ENCODING => '', // Enable compression
            ]);
            
            $response = curl_exec($ch);           
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            
            if (curl_errno($ch)) {
                $error = curl_error($ch);
                curl_close($ch);
                throw new Exception('cURL Error: ' . $error);
            }
            
            curl_close($ch);
            
            if ($httpCode !== 200) {
                throw new Exception('API returned HTTP ' . $httpCode);
            }
            
            $jsonData = json_decode($response, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('JSON Decode Error: ' . json_last_error_msg());
            }
            
            if (isset($jsonData['error'])) {
                throw new Exception('API Error: ' . ($jsonData['error']['message'] ?? 'Unknown error'));
            }
            
            // Optimize: Extract text content more efficiently
            $resultSet = self::extractTextFromResponse($jsonData);
            
            if (empty($resultSet)) {
                throw new Exception('No text content found in API response');
            }
            
            return [
                'status' => 'success',
                'msg' => "Analysis executed successfully",
                'result' => $resultSet
            ];
            
        } catch (Exception $e) {
            return ['status' => 'error', 'msg' => $e->getMessage()];
        }
    }
    
    /**
     * Optimize: Separate method for extracting text from response
     */
    private static function extractTextFromResponse($jsonData) {
        $resultSet = '';
        
        if (!isset($jsonData['output']) || !is_array($jsonData['output'])) {
            return $resultSet;
        }
        
        foreach ($jsonData['output'] as $block) {
            if (!isset($block['type']) || $block['type'] !== 'message') {
                continue;
            }
            
            if (!isset($block['content']) || !is_array($block['content'])) {
                continue;
            }
            
            foreach ($block['content'] as $contentItem) {
                if (
                    isset($contentItem['type']) &&
                    $contentItem['type'] === 'output_text' &&
                    isset($contentItem['text'])
                ) {
                    $resultSet .= $contentItem['text'];
                }
            }
        }
        
        // Fallback
        if (empty($resultSet) && isset($jsonData['output'][0]['content'][0]['text'])) {
            $resultSet = $jsonData['output'][0]['content'][0]['text'];
        }
        
        return $resultSet;
    }
    
    /**
     * Optimize: Cache prompts with TTL
     */
    public static function getPrompt() {
        try {
            // Check cache
            $currentTime = time();
            if (
                self::$promptCache !== null && 
                ($currentTime - self::$promptCacheTime) < self::$promptCacheTTL
            ) {
                return [
                    'status' => 'success',
                    'msg' => "Prompt fetched from cache",
                    'result' => self::$promptCache
                ];
            }
            
            // Fetch from database
            $resultSet = [];
            $query = "SELECT `model`, `prompt` FROM `prompts`";
            $result = dbconfig::run($query);
            
            if (!$result) {
                throw new Exception("Database query failed");
            }
            
            if (mysqli_num_rows($result) > 0) {
                while ($row = mysqli_fetch_assoc($result)) {
                    $resultSet[$row['model']] = $row['prompt'];
                }
            }
            
            // Update cache
            self::$promptCache = $resultSet;
            self::$promptCacheTime = $currentTime;
            
            return [
                'status' => 'success',
                'msg' => "Prompt fetched successfully",
                'result' => $resultSet
            ];
            
        } catch (Exception $e) {
            return ['status' => 'error', 'msg' => $e->getMessage()];
        }
    }
    
    /**
     * Optional: Method to clear prompt cache if needed
     */
    public static function clearPromptCache() {
        self::$promptCache = null;
        self::$promptCacheTime = 0;
    }
}