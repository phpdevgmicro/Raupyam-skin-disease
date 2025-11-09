# Backend Integration Guide for Magic Section

## Overview

The Magic Section requires a PHP backend endpoint to securely call OpenAI's API without exposing the API key on the client-side.

## Required PHP Endpoint

### Endpoint Details
- **URL**: `/route.php?type=personalize-magic`
- **Method**: POST
- **Content-Type**: application/json

### Request Body

```json
{
  "userData": {
    "age": 30,
    "gender": "female",
    "skinType": "combination",
    "topConcern": ["acne", "redness"]
  },
  "environmentData": {
    "city": "San Francisco",
    "aqi": 45,
    "aqiCategory": "Good",
    "humidity": 65,
    "uvIndex": 6,
    "temperature": 18
  }
}
```

### Response

```json
{
  "personalizedText": "**Your World's Whisper to Your Skin: How We Craft Smarter**\n\nWe don't guess—we *get* your backdrop..."
}
```

### Error Response

```json
{
  "error": "Failed to generate personalized text",
  "details": "OpenAI API error message"
}
```

## Implementation

See `docs/php-backend/personalize-magic-endpoint.php` for the complete implementation example.

## Security Notes

1. **Never** expose the OpenAI API key on the client-side
2. Store the API key in server environment variables
3. Validate and sanitize all input data
4. Implement rate limiting to prevent abuse
5. Add CORS headers for your frontend domain only

## Frontend Integration

The frontend is already configured to use the static template. To enable backend integration:

1. Deploy the PHP endpoint to your backend server
2. Update `src/lib/magicSection.ts` to call the backend endpoint instead of using the static template
3. Handle loading states and errors appropriately

## Testing

Test the endpoint with:

```bash
curl -X POST https://your-backend.com/route.php?type=personalize-magic \
  -H "Content-Type: application/json" \
  -d '{
    "userData": {
      "age": 30,
      "gender": "female",
      "skinType": "combination",
      "topConcern": ["acne"]
    },
    "environmentData": {
      "city": "Seattle",
      "aqi": 55,
      "aqiCategory": "Moderate",
      "humidity": 75,
      "uvIndex": 4,
      "temperature": 15
    }
  }'
```
