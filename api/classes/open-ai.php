<?php 
require_once("config.php");

class OPENAITOOL {
    public static $data;
    
    // Optimize: Cache prompts to avoid DB queries on every request
    private static $promptCache = null;
    private static $promptCacheTime = 0;
    private static $promptCacheTTL = 1; // 1 hour cache
    
    public static function visionGpt($image, $prompt, $accessToken, $airQuality, $userData) {
        try {
            if (!isset($prompt['result']['vision'])) {
                throw new \Exception('Vision prompt not found');
            }
            
            $instruction = $prompt['result']['vision'];
            
            // Optimize: Build user text more efficiently
            $userTextParts = [$airQuality];
            
            $userFields = [
                'fullName' => 'Name',
                'age' => 'Age',
                'gender' => 'Gender',
                'skinType' => 'Skin Type'
            ];
            
            foreach ($userFields as $key => $label) {
                if (!empty($userData[$key])) {
                    $userTextParts[] = "$label: {$userData[$key]}";
                }
            }
            
            $text = implode("\n", $userTextParts);
            
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
                            ['type' => 'input_text',  'text'=>  "IMPORTANT: Format your response using HTML tags for proper structure:
                                    - Use <h2> for main section headings
                                    - Use <h3> for sub-section headings
                                    - Use <p class=\"final-result-para\"> for paragraphs
                                    - Use <ul> and <li> for lists
                                    - Use <strong> for emphasis  
                                    Structure your response with clear HTML formatting to make it easy to read and understand.

                                    Note: Avoid too much margin bottom between <p> tags."
                            ],
                        ]
                    ]
                ],
                "max_output_tokens" => 5000
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
                CURLOPT_TIMEOUT => 60,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0,
                CURLOPT_ENCODING => '',
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
     * Personalize Magic Section
     * Generates personalized skincare text based on user profile and environmental data
     */
    public static function personalizeMagic($userData, $environmentData, $accessToken) {
        try {
            // Template text
            $templateText = "Your World's Whisper to Your Skin: How We Craft Smarter
We don't guess—we *get* your backdrop. Pulling live deets like:
- **Air Quality (AQI/PM2.5)**: Smog in **[CITY]**? Antioxidant armor (think liposome vitamin C—sips in protection without the weight).
- **Water Quality**: Mineral-heavy taps? Soothing hyaluronics to melt away that parched pull.
- **UV & Humidity**: Fierce rays or sticky air? Tailored shields—matte in the tropics, rich in the chill.
Blend with your age/gender/skin intel = your no-BS recipe. (E.g., 28yo oily type in sunny Sydney? Niacinamide gel with UV-synced mattifiers—clearer, bouncier by week 3.)";
            
            // System prompt for personalization
            $instruction = "You are a Dynamic Text Personalizer for a skincare app. Your job: Take a static text template and user/env data, then rewrite it to feel hyper-personal—like a custom note from a skincare coach.

Rules:
- Inject data naturally: Swap placeholders (e.g., [CITY]) with exact values; adapt examples to match user profile (e.g., if age=42, skin=oily, high UV—suggest \"niacinamide mist for oil-taming glow\").
- Keep tone warm, witty, global: Empathetic, fun, empowering (e.g., \"Your city's haze? We've got shields!\").
- Brevity: Output exactly matches the template structure/length—trim fluff, no additions.
- Personalization Logic:
  - Env: Tie to skincare (e.g., high AQI → \"antioxidant boost\"; high humidity → \"matte textures\").
  - User: Blend age/gender/skin (e.g., \"For your 30s oily vibe...\").
  - Examples: Always 1 tailored \"E.g.\" sentence; quantify wins (e.g., \"smoother by week 2\").
- Output ONLY the modified text—no intros, explanations, or code. Use markdown for lists/bolds.
- If data missing, use neutrals (e.g., \"your city\" for [CITY]).


Modify the template by injecting the data. Make the \"E.g.\" example user-specific (e.g., tie skin/env to a rec like \"ceramide lock for rainy days\"). Keep structure identical.";
            
// Build user context with JSON data
$userContext = "Template Text to Modify:
$templateText

Raw Data (JSON—use only this for personalization):
{
    user:". json_encode($userData, JSON_PRETTY_PRINT) . "
    env:". json_encode($environmentData, JSON_PRETTY_PRINT) . "
}

Instructions: Modify the template by injecting the data. Make the \"E.g.\" example user-specific (e.g., tie skin/env to a rec like \"ceramide lock for rainy days\"). Keep structure identical.";

            
            // Optimize: Only log if logging is enabled
            //if (defined('ENABLE_LOGGING') && ENABLE_LOGGING) {
                $logFile = 'logs/personalize_magic_' . date('Y-m-d') . '.log';
                file_put_contents(
                    $logFile, 
                    "User Context:\n" . $userContext . "\n\n", 
                    FILE_APPEND | LOCK_EX
                );
           // }
            
            // Build request payload using Responses API format (like visionGpt)
            $payload = [
                "model" => "gpt-4.1-mini",
                "input" => [
                    ['role' => 'developer', 'content' => $instruction],
                    ['role' => 'user', 'content' => [
                        ['type' => 'input_text', 'text' => $userContext]
                    ]]
                ],         
                "max_output_tokens" => 500,
                "temperature"=> 0.3
            ];
            
            // Make curl request to OpenAI Responses API
            $ch = curl_init("https://api.openai.com/v1/responses");
            curl_setopt_array($ch, [
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payload),
                CURLOPT_HTTPHEADER => [
                    "Content-Type: application/json",
                    "Authorization: Bearer " . $accessToken
                ],
                CURLOPT_TIMEOUT => 60,
                CURLOPT_CONNECTTIMEOUT => 10,
                CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0,
                CURLOPT_ENCODING => '',
            ]);
            
            $response = curl_exec($ch);

            //echo"<pre>";print_r($response);
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
            
            // Extract text content using the same method as visionGpt
            $personalizedText = self::extractTextFromResponse($jsonData);
            
            if (empty($personalizedText)) {
                throw new Exception('No text content found in API response');
            }
            
            return [
                'status' => 'success',
                'msg' => 'Text personalized successfully',
                'result' => $personalizedText
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