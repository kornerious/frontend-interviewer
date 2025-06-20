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
  promptTemplate: `You are an expert curriculum designer for frontend development interviews with deep knowledge of learning progressions.
You have {itemCount} content items (indexes {startIndex}–{endIndex}), each with these metadata fields: {metadataFields}.

Your task is to create an optimized learning curriculum by:

1. CLUSTERING: Group items into 8-12 focused thematic clusters (like "JavaScript Closures", "React Hooks", "CSS Grid Systems")

2. PRECISE SEQUENCING: Within each cluster, create a carefully ordered learning sequence from absolute beginner (1) to expert (5) levels

3. DEPENDENCY MAPPING: Create a comprehensive dependency graph by identifying:
   - INTERNAL dependencies: prerequisite items within the same cluster
   - EXTERNAL dependencies: crucial prerequisites from other thematic clusters
   - TECHNOLOGY dependencies: underlying technical requirements

4. COMPLEXITY DIFFERENTIATION: Assign each item a specific complexity score (1-5) where:
   - Level 1: Complete beginner concepts (first exposure topics)
   - Level 2: Basic practical application (fundamentals)
   - Level 3: Intermediate working knowledge (standard patterns)
   - Level 4: Advanced applications (optimizations, edge cases)
   - Level 5: Expert mastery (deep internals, novel applications)

Return a JSON response with this exact structure:
{
  "clusters": [
    {
      "name": "Cluster name - be specific and focused",
      "description": "Detailed description explaining scope and importance",
      "recommendedSequence": "Suggested study order (e.g., 'Start with X, then Y, finally master Z')",
      "items": [
        {
          "index": 123,
          "id": "item_id",
          "complexity": 1-5,
          "clusterPositionReason": "Why this belongs in THIS specific position within its cluster",
          "prerequisiteItems": ["id1", "id2"],
          "externalPrerequisites": [
            {
              "cluster": "Name of prerequisite cluster",
              "conceptId": "id123",
              "reason": "Why this external concept is necessary before learning this item"
            }
          ],
          "learningOutcomes": ["What the learner will gain from this item"]
        }
      ]
    }
  ]
}

Important guidelines:
- Every item must be assigned to exactly ONE most-relevant cluster
- Use varied, meaningful descriptions - avoid formulaic patterns
- Create true progressive difficulty (mix of levels 1-5) within each cluster
- CRITICAL: Every non-beginner item MUST have at least one cross-cluster dependency identified
- Cross-cluster dependencies should be precisely mapped with cluster name, concept ID, and justification
- Pay special attention to identifying conceptual prerequisites across technology boundaries (e.g., JS fundamentals before React)
- Provide actionable learning pathways a student could follow
- Ensure your response is valid JSON with ALL required fields`
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
