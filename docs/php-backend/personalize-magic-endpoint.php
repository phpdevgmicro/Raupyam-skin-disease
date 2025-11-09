<?php
/**
 * Personalize Magic Section Endpoint
 * 
 * This endpoint generates personalized skincare text using OpenAI's GPT-5 model
 * based on user profile data and environmental conditions.
 * 
 * @endpoint POST /route.php?type=personalize-magic
 * @requires OpenAI API Key in environment variable OPENAI_API_KEY
 */

// Allow CORS for your frontend domain only
header('Access-Control-Allow-Origin: https://your-frontend-domain.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Get OpenAI API key from environment
$openaiApiKey = getenv('OPENAI_API_KEY');
if (!$openaiApiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'OpenAI API key not configured']);
    exit();
}

// Read and validate request body
$requestBody = file_get_contents('php://input');
$data = json_decode($requestBody, true);

if (!$data || !isset($data['userData']) || !isset($data['environmentData'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid request body']);
    exit();
}

// Extract data
$userData = $data['userData'];
$envData = $data['environmentData'];

// Template text
$templateText = "Your World's Whisper to Your Skin: How We Craft Smarter
We don't guess—we *get* your backdrop. Pulling live deets like:
- **Air Quality (AQI/PM2.5)**: Moderate haze in **[CITY]**? Antioxidant armor (think liposome vitamin C—sips in protection without the weight).
- **Water Quality**: High minerals? Soothing hyaluronics to melt away that parched pull.
- **UV & Humidity**: Low rays in sticky air? Tailored shields—matte in the tropics, rich in the chill.
Blend with your age/gender/skin intel = your no-BS recipe. (E.g., 35yo combination type in rainy Seattle? Peptide emulsion with humectant layers—balanced, dewy by week 3.)";

// System prompt for OpenAI
$systemPrompt = "You are a Dynamic Text Personalizer for a skincare app. Your job: Take a static text template and user/env data, then rewrite it to feel hyper-personal—like a custom note from a skincare coach.

Rules:
- Inject data naturally: Swap placeholders (e.g., [CITY]) with exact values; adapt examples to match user profile (e.g., if age=42, skin=oily, high UV—suggest \"niacinamide mist for oil-taming glow\").
- Keep tone warm, witty, global: Empathetic, fun, empowering (e.g., \"Your city's haze? We've got shields!\").
- Brevity: Output exactly matches the template structure/length—trim fluff, no additions.
- Personalization Logic:
  - Env: Tie to skincare (e.g., high AQI → \"antioxidant boost\"; high humidity → \"matte textures\").
  - User: Blend age/gender/skin (e.g., \"For your 30s oily vibe...\").
  - Examples: Always 1 tailored \"E.g.\" sentence; quantify wins (e.g., \"smoother by week 2\").
- Output ONLY the modified text—no intros, explanations, or code. Use markdown for lists/bolds.
- If data missing, use neutrals (e.g., \"your city\" for [CITY]).";

// Build user context
$userContext = "User Profile:
- Age: " . ($userData['age'] ?? 'not specified') . "
- Gender: " . ($userData['gender'] ?? 'not specified') . "
- Skin Type: " . ($userData['skinType'] ?? 'not specified') . "
- Top Concerns: " . (isset($userData['topConcern']) ? implode(', ', $userData['topConcern']) : 'not specified') . "

Environmental Data for " . $envData['city'] . ":
- Air Quality Index (AQI): " . ($envData['aqi'] ?? 'unknown') . " " . (isset($envData['aqiCategory']) ? "({$envData['aqiCategory']})" : '') . "
- Humidity: " . (isset($envData['humidity']) ? "{$envData['humidity']}%" : 'unknown') . "
- UV Index: " . ($envData['uvIndex'] ?? 'unknown') . "
- Temperature: " . (isset($envData['temperature']) ? "{$envData['temperature']}°C" : 'unknown') . "

Template to personalize:
$templateText";

// Prepare OpenAI API request
$openaiPayload = [
    'model' => 'gpt-5', // Note: gpt-5 was released on August 7, 2025
    'messages' => [
        [
            'role' => 'system',
            'content' => $systemPrompt
        ],
        [
            'role' => 'user',
            'content' => $userContext
        ]
    ],
    'max_completion_tokens' => 500
];

// Make curl request to OpenAI
$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($openaiPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $openaiApiKey
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

// Handle curl errors
if ($curlError) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to connect to OpenAI',
        'details' => $curlError
    ]);
    exit();
}

// Handle non-200 responses from OpenAI
if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode([
        'error' => 'OpenAI API error',
        'details' => $response
    ]);
    exit();
}

// Parse OpenAI response
$openaiResponse = json_decode($response, true);
if (!$openaiResponse || !isset($openaiResponse['choices'][0]['message']['content'])) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Invalid response from OpenAI',
        'details' => $response
    ]);
    exit();
}

// Return the personalized text
$personalizedText = $openaiResponse['choices'][0]['message']['content'];

echo json_encode([
    'personalizedText' => $personalizedText
]);
