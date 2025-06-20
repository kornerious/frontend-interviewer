/**
 * AIClient
 * 
 * Handles communication with Gemini API for curriculum generation
 */
import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

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
  private model: GenerativeModel;
  
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
    this.model = this.genAI.getGenerativeModel({ model: this.config.model });
    
    console.log(`AIClient: Initialized with model ${this.config.model}`);
  }
  
  /**
   * Send a prompt to the Gemini API
   * @param prompt The prompt to send
   * @returns The response from the API
   */
  async sendPrompt(prompt: string): Promise<any> {
    try {
      console.log(`AIClient: Sending prompt to ${this.model}`);
      console.log('AIClient: Full prompt:', prompt);
      
      const generationConfig = {
        temperature: 1.0,
        topP: 0.95,
        maxOutputTokens: 60000,
      };
      
      console.log('AIClient: Generation config:', JSON.stringify(generationConfig));
      
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ];
      
      console.log('AIClient: Starting API request at:', new Date().toISOString());

      console.log("prompt: "+prompt);
      // Send the request
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
        safetySettings,
      });
      
      console.log('AIClient: Completed API request at:', new Date().toISOString());
      
      const response = result.response;
      const text = response.text();
      
      console.log(`AIClient: Received response from ${this.model}`);
      console.log('AIClient: Raw response:', text.substring(0, 500) + '...' + text.substring(text.length - 500));
      
      // Parse the response as JSON
      try {
        const parsedResponse = JSON.parse(text);
        console.log('AIClient: Parsed response structure:', JSON.stringify(Object.keys(parsedResponse)));
        return parsedResponse;
      } catch (parseError) {
        console.error('AIClient: Failed to parse response as JSON:', parseError);
        console.log('AIClient: Full raw response:', text);
        throw new Error('Failed to parse AI response as JSON');
      }
    } catch (error) {
      console.error('AIClient: Error sending prompt:', error);
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
      this.model = this.genAI.getGenerativeModel({ model: this.config.model });
    }
  }
}
