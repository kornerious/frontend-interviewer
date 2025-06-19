import { ChunkData } from './chunkManager';
import { PromptBuilder } from './promptBuilder';
import { MetadataItem } from './metadataExtractor';

export interface AIClusteringResult {
  clusters: {
    name: string;
    technology: string;
    learningPath: string;
    itemIndexes: number[];
  }[];
}

/**
 * Phase 2: AI-Assisted Clustering & Sequencing
 * Step 5: Process Each Chunk with Gemini (AIClient)
 */
export class AIClient {
  private readonly apiKey: string;
  private readonly promptBuilder: PromptBuilder;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  
  constructor(
    apiKey: string = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    maxRetries: number = 3,
    retryDelayMs: number = 1000
  ) {
    this.apiKey = apiKey;
    this.promptBuilder = new PromptBuilder();
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
  }
  
  /**
   * Process a chunk with Gemini API
   */
  async processChunk(
    chunk: ChunkData,
    onProgress?: (message: string) => void
  ): Promise<AIClusteringResult> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured');
    }
    
    onProgress?.(`Processing chunk ${chunk.id} with Gemini API (items ${chunk.startIndex}-${chunk.endIndex})`);
    
    // Build the prompt
    const prompt = this.promptBuilder.buildClusteringPrompt(chunk);
    
    // Prepare the items data to send to Gemini
    const itemsData = chunk.items.map(item => ({
      id: item.id,
      index: item.index,
      type: item.type,
      tags: item.tags,
      technology: item.technology,
      learningPath: item.learningPath,
      complexity: item.complexity,
      prerequisites: item.prerequisites,
      requiredFor: item.requiredFor,
      interviewRelevance: item.interviewRelevance,
      interviewFrequency: item.interviewFrequency,
      score: item.score
    }));
    
    // Call Gemini API with retries
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        onProgress?.(`Attempt ${attempt}/${this.maxRetries} to process chunk ${chunk.id}`);
        
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  { 
                    inlineData: {
                      mimeType: 'application/json',
                      data: Buffer.from(JSON.stringify(itemsData)).toString('base64')
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.2,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json'
            }
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        
        // Extract the JSON response from Gemini
        const content = data.candidates?.[0]?.content;
        if (!content) {
          throw new Error('Empty response from Gemini API');
        }
        
        const text = content.parts?.[0]?.text;
        if (!text) {
          throw new Error('No text in Gemini API response');
        }
        
        // Extract JSON from the response (it might be wrapped in markdown code blocks)
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                         text.match(/```\n([\s\S]*?)\n```/) || 
                         text.match(/{[\s\S]*}/);
                         
        const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text;
        
        try {
          const result = JSON.parse(jsonText);
          onProgress?.(`Successfully processed chunk ${chunk.id}`);
          return result;
        } catch (parseError: unknown) {
          const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
          throw new Error(`Failed to parse Gemini API response as JSON: ${errorMessage}`);
        }
      } catch (error: unknown) {
        if (attempt === this.maxRetries) {
          throw error;
        }
        
        // Wait before retrying
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onProgress?.(`Error processing chunk ${chunk.id}, retrying in ${this.retryDelayMs}ms: ${errorMessage}`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelayMs * attempt));
      }
    }
    
    throw new Error(`Failed to process chunk ${chunk.id} after ${this.maxRetries} attempts`);
  }
}
