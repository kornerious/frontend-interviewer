import { AIReviewRequest, AIReviewResponse, QuestionItem, TaskItem } from '@/types';

// Gemini API service
const callGeminiAPI = async (prompt: string): Promise<string> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not defined in environment variables');
    }
    
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192
        }
      })
    });

    const data = await response.json();
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

// DeepSeek API service via OpenRouter
const callDeepSeekAPI = async (prompt: string): Promise<string> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is not defined in environment variables');
    }
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-coder-v2',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 8192
      })
    });

    const data = await response.json();
    if (!data.choices || !data.choices[0]?.message?.content) {
      throw new Error('Invalid response format from DeepSeek API');
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    throw error;
  }
};

// Parse AI response to structured format
const parseAIResponse = (response: string): AIReviewResponse => {
  try {
    // Extract correctness
    const isCorrect = response.toLowerCase().includes('correct') || 
                      response.toLowerCase().includes('passes all tests');
    
    // Extract score if available
    const scoreMatch = response.match(/score:\s*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : undefined;
    
    // Extract suggestions
    const suggestionPattern = /suggestions?:|improvements?:|could be improved by:|consider:|recommendations?:/i;
    const parts = response.split(suggestionPattern);
    
    let suggestions: string[] = [];
    if (parts.length > 1) {
      const suggestionText = parts[1].trim();
      suggestions = suggestionText
        .split(/\d+\.\s|\n-\s|\n\*\s/)
        .filter(s => s.trim().length > 0)
        .map(s => s.trim());
    }
    
    return {
      isCorrect,
      feedback: response,
      suggestions,
      score
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    return {
      isCorrect: false,
      feedback: response,
      suggestions: []
    };
  }
};

// Main review function
export const reviewCode = async (
  request: AIReviewRequest, 
  aiReviewer: 'deepseek' | 'gemini' | 'both'
): Promise<AIReviewResponse> => {
  try {
    // Construct prompt
    const prompt = `
      You are an expert code reviewer for frontend interview preparation.
      
      Please review the following ${request.type === 'task' ? 'coding task solution' : 'answer to a question'}.
      
      ${request.type === 'task' ? 'TASK:' : 'QUESTION:'} ${request.prompt}
      
      ${request.type === 'task' ? 'USER CODE:' : 'USER ANSWER:'} 
      \`\`\`
      ${request.userCode}
      \`\`\`
      
      ${request.testCases && request.testCases.length > 0 ? 
        `TEST CASES TO VERIFY:\n${request.testCases.join('\n')}` : ''}
      
      Please provide a detailed review including:
      1. Is the solution correct? (Yes/No)
      2. Detailed explanation of why it is correct or incorrect
      3. Code quality assessment (efficiency, readability, best practices)
      4. Suggestions for improvement
      5. Alternative approaches if applicable
      
      Format your response in a clear, structured way.
    `;
    
    let response: string;
    
    // Call appropriate AI service(s)
    if (aiReviewer.toLowerCase() === 'deepseek') {
      response = await callDeepSeekAPI(prompt);
    } else if (aiReviewer.toLowerCase() === 'gemini') {
      response = await callGeminiAPI(prompt);
    } else {
      // Call both and combine results
      const [deepSeekResponse, geminiResponse] = await Promise.all([
        callDeepSeekAPI(prompt),
        callGeminiAPI(prompt)
      ]);
      
      response = `
        === DEEPSEEK REVIEW ===
        ${deepSeekResponse}
        
        === GEMINI REVIEW ===
        ${geminiResponse}
      `;
    }
    
    return parseAIResponse(response);
  } catch (error) {
    console.error('Error reviewing code:', error);
    throw error;
  }
};

// Generate similar items for incorrect answers
export const generateSimilarItems = async (
  items: (QuestionItem | TaskItem)[],
  aiModel: 'deepseek' | 'gemini' | 'both' = 'gemini'
): Promise<(QuestionItem | TaskItem)[]> => {
  try {
    const results: (QuestionItem | TaskItem)[] = [];
    
    for (const item of items) {
      const itemType = 'type' in item ? item.type : 
                      'options' in item ? 'question' : 'task';
      
      const similarItem = await generateSimilarItem(
        itemType as 'question' | 'task',
        item,
        aiModel
      );
      
      results.push(similarItem);
    }
    
    return results;
  } catch (error) {
    console.error('Error generating similar items:', error);
    throw error;
  }
};

// Generate a single similar item for incorrect answers
export const generateSimilarItem = async (
  itemType: 'question' | 'task',
  originalItem: QuestionItem | TaskItem,
  aiModel: 'deepseek' | 'gemini' | 'both' = 'gemini'
): Promise<QuestionItem | TaskItem> => {
  try {
    const prompt = `
      You are an expert in creating frontend interview content.
      
      Please create a new ${itemType} similar to the one below but with different specifics:
      
      ORIGINAL ${itemType.toUpperCase()}:
      ${JSON.stringify(originalItem, null, 2)}
      
      Create a new ${itemType} that:
      1. Tests the same concepts but in a different way
      2. Has the same difficulty level
      3. Follows the exact same JSON structure as the original
      4. Has unique content that doesn't duplicate the original
      5. Includes a new unique ID prefixed with "generated_"
      
      Return ONLY the JSON object for the new ${itemType}, properly formatted.
    `;
    
    let response: string;
    
    if (aiModel.toLowerCase() === 'deepseek') {
      response = await callDeepSeekAPI(prompt);
    } else if (aiModel.toLowerCase() === 'gemini') {
      response = await callGeminiAPI(prompt);
    } else {
      // Use Gemini as default for generation tasks
      response = await callGeminiAPI(prompt);
    }
    
    // Extract JSON from response
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                     response.match(/```\n([\s\S]*?)\n```/) ||
                     response.match(/{[\s\S]*}/);
                     
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    
    throw new Error('Failed to parse generated item');
  } catch (error) {
    console.error('Error generating similar item:', error);
    throw error;
  }
};
