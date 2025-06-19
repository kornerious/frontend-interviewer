import { MetadataItem } from './metadataExtractor';
import { DependencyGraph } from './graphBuilder';
import { topologicalSort } from '../dataService';

/**
 * Phase 1: Foundational Data Preparation & Analysis
 * Step 3: Initial Deterministic Scoring
 */
export const scoreItems = (
  metadata: MetadataItem[],
  dependencyGraph: DependencyGraph
): MetadataItem[] => {
  console.log('Phase 1, Step 3: Performing initial deterministic scoring');
  
  // Perform topological sort to get item ordering
  const order = topologicalSort(dependencyGraph);
  
  // Create a position map for quick lookup
  const positionMap: { [key: string]: number } = {};
  order.forEach((id, index) => {
    positionMap[id] = index;
  });
  
  // Score each item
  const scoredItems = metadata.map(item => {
    // 1. Prerequisite Depth: Based on topological position
    const topologicalScore = positionMap[item.id] !== undefined 
      ? 10 - (positionMap[item.id] / Math.max(1, order.length)) * 10
      : 5;
    
    // 2. Difficulty & Relevance: Weighted sum of complexity, relevance, frequency
    let difficultyRelevanceScore = 0;
    
    // Complexity (inverted so lower complexity = higher score)
    const complexityScore = 10 - (item.complexity || 5);
    
    // Interview relevance/frequency
    const relevanceScore = item.type === 'question' 
      ? (item.interviewFrequency || 5) 
      : (item.interviewRelevance || 5);
    
    difficultyRelevanceScore = (complexityScore * 0.4) + (relevanceScore * 0.6);
    
    // 3. Thematic Cohesion: Boost for learning path and technology clustering
    let thematicScore = 0;
    
    // Tag density
    const tagScore = Math.min(item.tags.length, 10);
    
    // Learning path boost
    const learningPathBoost = {
      'beginner': 10,
      'intermediate': 7,
      'advanced': 4,
      'expert': 1
    }[item.learningPath] || 5;
    
    thematicScore = (tagScore * 0.4) + (learningPathBoost * 0.6);
    
    // Final composite score (normalized to 0-100)
    const score = (
      (topologicalScore * 0.5) + 
      (difficultyRelevanceScore * 0.3) + 
      (thematicScore * 0.2)
    ) * 10;
    
    return {
      ...item,
      score
    };
  });
  
  console.log('Completed initial scoring of all items');
  return scoredItems;
};
