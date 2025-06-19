import { ChunkData } from './chunkManager';
import { MetadataItem } from './metadataExtractor';

/**
 * Phase 2: AI-Assisted Clustering & Sequencing
 * Step 5: Process Each Chunk with Gemini (PromptBuilder)
 */
export class PromptBuilder {
  /**
   * Builds a prompt for Gemini to cluster and sequence items
   */
  buildClusteringPrompt(chunk: ChunkData): string {
    const { items, startIndex, endIndex } = chunk;
    
    // Count items by type
    const theoryCounts = items.filter(item => item.type === 'theory').length;
    const questionCounts = items.filter(item => item.type === 'question').length;
    const taskCounts = items.filter(item => item.type === 'task').length;
    
    // Extract unique technologies and learning paths
    const technologies = [...new Set(items.filter(i => i.technology).map(i => i.technology))];
    const learningPaths = [...new Set(items.map(i => i.learningPath))];
    
    // Build the prompt
    const prompt = `
You are an expert curriculum designer for a frontend interview preparation platform.

You have ${items.length} content items (indexes ${startIndex}–${endIndex}), consisting of:
- ${theoryCounts} theory items
- ${questionCounts} question items
- ${taskCounts} task items

Each item has these metadata fields:
- id: unique identifier
- type: 'theory', 'question', or 'task'
- tags: array of topic tags
- technology: the primary technology (${technologies.join(', ')})
- learningPath: the target expertise level (${learningPaths.join(', ')})
- complexity: 1-10 implementation difficulty
- prerequisites: array of item IDs that should be learned before this item
- requiredFor: array of item IDs that require this item
- interviewRelevance/interviewFrequency: 1-10 real-world importance

TASK:
1. Identify prerequisite chains and natural thematic clusters (e.g., "Event Loop", "React State", "CSS Layout")
2. Group items into these clusters based on shared tags, technology, and learning path
3. For each cluster, propose an ordered learning sequence from beginner to expert
4. Ensure prerequisites are respected in your ordering

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "clusters": [
    {
      "name": "Cluster Name",
      "technology": "primary technology",
      "learningPath": "target expertise level",
      "itemIndexes": [array of original item indexes in recommended sequence]
    }
  ]
}

IMPORTANT:
- Focus on creating pedagogically sound sequences
- Respect prerequisite relationships
- Group related concepts together
- Progress from fundamental to advanced topics
- Ensure each cluster has a clear thematic focus
`;

    return prompt;
  }
  
  /**
   * Builds a prompt for the final AI pass to refine the overall sequence
   */
  buildSequenceRefinementPrompt(
    mergedItems: MetadataItem[],
    clusters: { name: string; items: MetadataItem[] }[]
  ): string {
    // Build the prompt
    const prompt = `
You are an expert curriculum designer for a frontend interview preparation platform.

I've already organized ${mergedItems.length} content items into ${clusters.length} thematic clusters:
${clusters.map(c => `- ${c.name} (${c.items.length} items)`).join('\n')}

Each item has these metadata fields:
- id: unique identifier
- type: 'theory', 'question', or 'task'
- tags: array of topic tags
- technology: the primary technology
- learningPath: the target expertise level
- complexity: 1-10 implementation difficulty
- prerequisites: array of item IDs that should be learned before this item
- requiredFor: array of item IDs that require this item
- interviewRelevance/interviewFrequency: 1-10 real-world importance

TASK:
1. Review the overall curriculum flow across all clusters
2. Suggest refinements to the sequence to create a smoother learning progression
3. Identify any cross-cluster dependencies that should be addressed
4. Ensure the overall curriculum flows logically from beginner to expert topics

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "refinedSequence": [
    {
      "clusterName": "Cluster Name",
      "suggestedPosition": number,
      "notes": "Explanation for this positioning"
    }
  ],
  "crossClusterDependencies": [
    {
      "sourceCluster": "Cluster Name",
      "targetCluster": "Cluster Name",
      "explanation": "Why this dependency exists"
    }
  ]
}

IMPORTANT:
- Focus on the big picture of the entire curriculum
- Ensure logical progression of topics
- Identify any potential knowledge gaps
- Suggest how to interleave related content for better learning outcomes
`;

    return prompt;
  }
}
