/**
 * AIClient
 * 
 * Handles communication with Gemini API for curriculum generation
 */
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

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
  apiKey: process.env.GEMINI_API_KEY || '',
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
        
        // Create a timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('AIClient: Request timed out')), this.config.timeoutMs);
        });
        
        // Create the API call promise
        const responsePromise = this.model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1, // Low temperature for more deterministic results
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        });
        
        // Race the promises
        const response = await Promise.race([responsePromise, timeoutPromise]) as any;
        
        // Extract the text response
        const responseText = response.response.text();
        
        // Try to parse as JSON
        try {
          // Find JSON content (in case there's surrounding text)
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
          }
          
          // If no JSON object found, try parsing the whole response
          return JSON.parse(responseText);
        } catch (parseError) {
          console.error('AIClient: Failed to parse JSON response:', parseError);
          console.log('AIClient: Raw response:', responseText);
          throw new Error('AIClient: Invalid JSON response from Gemini');
        }
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
