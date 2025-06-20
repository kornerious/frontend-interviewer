/**
 * AIClient
 * 
 * Handles communication with Gemini API for curriculum generation
 */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import axios from 'axios';

/**
 * Configuration for AI client
 */
export interface AIClientConfig {
  apiKey: string;
  model: string;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AIClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
  model: 'gemini-2.5-flash-preview-05-20',
  maxRetries: 3,
  retryDelayMs: 1000,
  timeoutMs: 120000 // 2 minutes
};

/**
 * AIClient class
 * 
 * Handles authentication, rate-limits, and retries for Gemini API calls
 */
export class AIClient {
  private config: AIClientConfig;
  private genAI: GoogleGenerativeAI;
  
  /**
   * Constructor
   * @param config AI client configuration
   */
  constructor(config: Partial<AIClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    if (!this.config.apiKey) {
      throw new Error('AIClient: Gemini API key is required');
    }
    
    this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    
    console.log(`AIClient: Initialized with model ${this.config.model}`);
  }
  
  /**
   * Send a prompt to the Gemini API
   * @param prompt The prompt to send
   * @returns The response from the API
   */
  async sendPrompt(prompt: string): Promise<any> {
    try {
      console.log(`AIClient: Sending prompt to Gemini API (direct axios call)`);
      console.log('AIClient: Full prompt:', prompt);
      
      // Define the Gemini API URL
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent`;
      
      // Build the request payload
      const requestPayload = {
        contents: [
          { 
            role: "user",
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 1.0,
          maxOutputTokens: 62000,
          topP: 0.95,
        },
      };
      
      console.log('AIClient: Starting API request at:', new Date().toISOString());
      console.log('AIClient: Request URL:', `${GEMINI_API_URL}?key=[API_KEY_REDACTED]`);
      console.log('AIClient: Request payload:', JSON.stringify(requestPayload, null, 2));
      
      // Send the request via axios
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${this.config.apiKey}`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 600000 // 10 minute timeout
        }
      );
      
      console.log('AIClient: Completed API request at:', new Date().toISOString());
      console.log('AIClient: Response status:', response.status);
      
      // Extract the text from the response
      const responseData = response.data;
      let text = '';
      
      // Extract text from the Gemini response format
      if (responseData.candidates && 
          responseData.candidates[0] && 
          responseData.candidates[0].content && 
          responseData.candidates[0].content.parts) {
        text = responseData.candidates[0].content.parts[0].text || '';
      }
      
      console.log('AIClient: Received response from Gemini API');
      console.log('AIClient: Raw response:', text.substring(0, 500) + '...' + (text.length > 1000 ? text.substring(text.length - 500) : ''));
      
      // Try to extract JSON from a code block in the response if direct parsing fails
      try {
        let jsonContent = text;
        
        // First try to parse the response directly as JSON
        try {
          const parsedResponse = JSON.parse(jsonContent);
          console.log('AIClient: Successfully parsed direct JSON response');
          console.log('AIClient: Parsed response structure:', JSON.stringify(Object.keys(parsedResponse)));
          return parsedResponse;
        } catch (directParseError) {
          console.log('AIClient: Direct JSON parsing failed, trying to extract from markdown code blocks');
          
          // If direct parsing fails, try to extract JSON from markdown code blocks
          const jsonBlockMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
          if (jsonBlockMatch && jsonBlockMatch[1]) {
            console.log('AIClient: Found JSON code block in response');
            jsonContent = jsonBlockMatch[1].trim();
            
            try {
              const parsedResponse = JSON.parse(jsonContent);
              console.log('AIClient: Successfully parsed JSON from code block');
              console.log('AIClient: Parsed response structure:', JSON.stringify(Object.keys(parsedResponse)));
              return parsedResponse;
            } catch (blockParseError) {
              console.error('AIClient: Failed to parse extracted code block as JSON:', blockParseError);
              throw new Error('Failed to parse extracted JSON code block');
            }
          } else {
            console.error('AIClient: No JSON code block found in response');
            console.log('AIClient: Full raw response:', text);
            throw new Error('No JSON code block found in AI response');
          }
        }
      } catch (parseError) {
        console.error('AIClient: All JSON parsing attempts failed:', parseError);
        console.log('AIClient: Full raw response:', text);
        throw new Error('Failed to extract or parse JSON from AI response');
      }
    } catch (error) {
      console.error('AIClient: Error sending prompt:', error);
      if (axios.isAxiosError(error)) {
        console.error('AIClient: Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
      }
      throw error;
    }
  }
  
  /**
   * Process a prompt with Gemini
   * @param prompt Prompt to send to Gemini
   * @returns JSON response from Gemini
   */
  public async processPrompt(prompt: string): Promise<any> {
    console.log('AIClient: Processing prompt with Gemini');
    
    let attempt = 0;
    let lastError: Error | null = null;
    
    while (attempt < this.config.maxRetries) {
      try {
        attempt++;
        console.log(`AIClient: Attempt ${attempt} of ${this.config.maxRetries}`);
        
        // Try to get a response with enhanced logging
        const response = await this.sendPrompt(prompt);
        return response;
        
      } catch (error: any) {
        console.error(`AIClient: Error on attempt ${attempt}:`, error.message);
        lastError = error;
        
        // If we haven't reached max retries, wait before trying again
        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`AIClient: Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we've exhausted all retries, throw the last error
    throw lastError || new Error('AIClient: Failed to process prompt after multiple attempts');
  }
  
  /**
   * Update the client configuration
   * @param config New configuration (partial)
   */
  public updateConfig(config: Partial<AIClientConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Reinitialize the client if the API key or model changed
    if (config.apiKey || config.model) {
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
    }
  }
}
