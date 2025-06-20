/**
 * PromptBuilder
 * 
 * Constructs detailed prompts for Gemini API based on curriculum chunks
 */
import { MetadataItem } from '../types/metadata';

/**
 * Interface for prompt configuration
 */
export interface PromptConfig {
  maxTokenCount: number;
  includeFullContent: boolean;
  includeMetadataFields: string[];
  promptTemplate: string;
}

/**
 * Default prompt configuration
 */
const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  maxTokenCount: 1000000,
  includeFullContent: false,
  includeMetadataFields: [
    'id', 'type', 'title', 'tags', 'technology', 'prerequisites', 
    'complexity', 'interviewRelevance', 'interviewFrequency', 'learningPath'
  ],
  promptTemplate: `You are an expert curriculum designer for frontend development interviews.
You have {itemCount} content items (indexes {startIndex}–{endIndex}), each with these metadata fields: {metadataFields}.

Your task:
1. Identify prerequisite chains in these items.
2. Group them into natural thematic clusters (e.g., Event Loop, React State, CSS Layout).
3. Propose an ordered learning sequence from beginner to expert for each cluster.

Return a JSON response with this exact structure:
{
  "clusters": [
    {
      "name": "Cluster name",
      "description": "Brief description of this thematic cluster",
      "items": [
        {
          "index": 123,
          "id": "item_id",
          "reason": "Brief explanation of why this item belongs in this position"
        }
      ]
    }
  ]
}

Important guidelines:
- Every item must be assigned to exactly one cluster
- Respect prerequisite relationships
- Order items from foundational to advanced within each cluster
- Focus on creating a natural learning progression
- Ensure your response is valid JSON`
};

/**
 * PromptBuilder class
 * 
 * Responsible for building prompts for AI processing
 */
export class PromptBuilder {
  private config: PromptConfig;
  
  /**
   * Constructor
   * @param config Prompt configuration
   */
  constructor(config: Partial<PromptConfig> = {}) {
    this.config = { ...DEFAULT_PROMPT_CONFIG, ...config };
  }
  
  /**
   * Build a prompt for a chunk of items
   * @param items Array of metadata items
   * @param startIndex Starting index of the chunk
   * @param endIndex Ending index of the chunk
   * @returns Prompt string
   */
  public buildPrompt(
    items: MetadataItem[],
    startIndex: number,
    endIndex: number
  ): string {
    console.log(`PromptBuilder: Building prompt for ${items.length} items (indexes ${startIndex}-${endIndex})`);
    
    // Extract relevant metadata fields
    const metadataFields = this.config.includeMetadataFields.join(', ');
    
    // Create a simplified version of items with only the needed fields
    const simplifiedItems = items.map(item => {
      const simplified: Record<string, any> = {};
      
      for (const field of this.config.includeMetadataFields) {
        if (field in item) {
          simplified[field] = item[field as keyof MetadataItem];
        }
      }
      
      return simplified;
    });
    
    // Replace placeholders in the template
    let prompt = this.config.promptTemplate
      .replace('{itemCount}', items.length.toString())
      .replace('{startIndex}', startIndex.toString())
      .replace('{endIndex}', endIndex.toString())
      .replace('{metadataFields}', metadataFields);
    
    // Add the items data
    prompt += `\n\nHere are the items to process:\n${JSON.stringify(simplifiedItems, null, 2)}`;
    
    // Estimate token count (rough approximation)
    const estimatedTokens = prompt.length / 4;
    console.log(`PromptBuilder: Estimated token count: ${estimatedTokens}`);
    
    if (estimatedTokens > this.config.maxTokenCount) {
      console.warn(`PromptBuilder: Warning - Prompt may exceed token limit (${estimatedTokens} > ${this.config.maxTokenCount})`);
    }
    
    return prompt;
  }
  
  /**
   * Update the prompt configuration
   * @param config New configuration (partial)
   */
  public updateConfig(config: Partial<PromptConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
