<?php require_once("config.php");

class OPENAITOOL {

   public static $data;

    public static function visionGpt($image, $prompt, $accessToken, $airQuality, $userData){      
		try {		
			$resultSet = ''; 	

			if(isset($prompt['result']['vision'])){
				$instruction = $prompt['result']['vision'];
			}else{
				$instruction = '';
			}
			
			// Start with Air Quality
			$text = $airQuality;

			// Properly get user details
			$fullName = $userData['fullName'] ?? '';
			$age = $userData['age'] ?? '';
			$gender = $userData['gender'] ?? '';			
			$skinType = $userData['skinType'] ?? '';
	

			// Add only if not empty
			if (!empty($fullName)) {
			    $text .= "\nName: $fullName";
			}
			if (!empty($age)) {
			    $text .= "\nAge: $age";
			}
			if (!empty($gender)) {
			    $text .= "\nGender: $gender";
			}
			if (!empty($skinType)) {
			    $text .= "\nSkin Type: $skinType";
			}	

			// LOG: User Text Data
	      $logFile = 'logs/vision_gpt_' . date('Y-m-d') . '.log';
	      $logEntry = "User Text Data:\n" . $text . "\n\n";
	      file_put_contents($logFile, $logEntry, FILE_APPEND);
			
			$history[] = ['role' => 'developer', 'content' => $instruction];

			$history[] = array(
				"role" => "user",
				"content" => array(
					array(
		            "type"=> "input_text",
		            "text"=>  $text
		         ),
					array(
						"type" => "input_image",
						"image_url" => $image
					)
				)
			);
			 
			$url = "https://api.openai.com/v1/responses";					
			$data = array(
				"model" => "gpt-5-mini",  
				"input" => $history,
				"max_output_tokens" => 2000,
				// "reasoning" => ["effort" => "low"]
				// "temperature" => 0.5				
			);			
			$headers = array(
				"Content-Type: application/json",
				"Authorization: Bearer ".$accessToken
			);
			
			$ch = curl_init($url);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			curl_setopt($ch, CURLOPT_POST, true);
			curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
			curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
			
			$response = curl_exec($ch);
			$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
			if (curl_errno($ch)) {
				throw new Exception('Error:' . curl_error($ch));
			}
			curl_close($ch);
			$jsonData = json_decode($response, true);
			if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON Decode Error: ' . json_last_error_msg());
         }

         // Check for API errors
         if (isset($jsonData['error'])) {
            throw new Exception('API Error: ' . ($jsonData['error']['message'] ?? 'Unknown error'));
         }

			// Extract text from response
        if (isset($jsonData['output']) && is_array($jsonData['output'])) {
            foreach ($jsonData['output'] as $block) {
                if (
                    isset($block['type']) &&
                    $block['type'] === 'message' &&
                    isset($block['content']) &&
                    is_array($block['content'])
                ) {
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
            }
        }
        
        // Fallback if the above didn't find anything
        if (empty($resultSet) && isset($jsonData['output'][0]['content'][0]['text'])) {
            $resultSet = $jsonData['output'][0]['content'][0]['text'];
        }
        
         if (empty($resultSet)) {
            throw new Exception('No text content found in API response');
         }	
			$data = array('status'=>'success', 'msg'=>"Analysis execute successfully", 'result'=>$resultSet);
		} catch (Exception $e) {
			$data = array('status'=>'error', 'msg'=>$e->getMessage());
		} finally {
			return $data;
		}		
	}	
	
	public static function getPrompt(){
		try {	
			$resultSet = array();		
			$query = "SELECT * FROM `prompts`";
			$result = dbconfig::run($query);  
			if(!$result) {
				throw new exception("Server not responde!");
			}
			if(mysqli_num_rows($result) > 0){	
				while($row = mysqli_fetch_assoc($result)){
					$resultSet[$row['model']] = $row['prompt'];	
				}		
			}
			$data = array('status'=>'success', 'msg'=>"Prompt fetch successfully.", 'result'=>$resultSet);
		}catch(Exception $e) {
			$data = array('status'=>'error', 'msg'=>$e->getMessage());
		}finally{
			return $data;
		}
	}	
	
}
