# OpenAI Prompt Update Instructions

To enable HTML formatting in AI responses, you need to update the `prompts` table in your MySQL database.

## Database Update Required

The AI responses are currently returning plain text. To get properly formatted HTML responses with tags like `<p>`, `<ul>`, `<li>`, `<h2>`, `<h3>`, `<small>`, etc., update the prompt for the 'vision' model in your database.

### SQL Query to Update Prompt:

```sql
UPDATE `prompts` 
SET `prompt` = 'You are an expert dermatologist AI assistant analyzing skin conditions. Based on the provided image and patient information (including air quality data), provide a comprehensive skin analysis.

IMPORTANT: Format your response using HTML tags for proper structure:
- Use <h2> for main section headings
- Use <h3> for sub-section headings
- Use <p> for paragraphs
- Use <ul> and <li> for lists
- Use <strong> for emphasis
- Use <small> for secondary information
- Use <br> for line breaks when needed

Your analysis should include:

1. **Condition Identification**: Clearly identify any visible skin conditions or concerns
2. **Severity Assessment**: Categorize as mild, moderate, or severe
3. **Environmental Factors**: Consider the air quality data and its potential impact on skin health
4. **Patient Context**: Consider age, gender, skin type, and other provided information
5. **Detailed Recommendations**: Provide specific, actionable skincare recommendations

Structure your response with clear HTML formatting to make it easy to read and understand.'
WHERE `model` = 'vision';
```

### Alternative: Use Admin Interface

If you have an admin interface for managing prompts, update the 'vision' model prompt there with the above text.

### Verification

After updating the prompt:
1. Submit a new skin analysis
2. Check that the AI response includes HTML tags
3. Verify the formatting displays correctly on the results page

## Frontend Changes (Already Completed)

The frontend has been updated to render HTML responses using:
- `dangerouslySetInnerHTML` for rendering HTML
- Tailwind Typography (`prose` classes) for styling
- Proper sanitization of HTML content

The AnalysisResults component now displays formatted HTML instead of plain text.
