/**
 * Score Calculator
 * 
 * Calculates composite scores for curriculum items based on:
 * 1. Prerequisite Depth (topological sort on dependency graph)
 * 2. Difficulty & Relevance (weighted sum of complexity, difficulty, etc.)
 * 3. Thematic Cohesion (clustering by learningPath and technology)
 */
import fs from 'fs';
import path from 'path';
import { ExtractedMetadata, MetadataItem, QuestionMetadata, TheoryMetadata, TaskMetadata } from '../types/metadata';
import { DependencyGraph, GraphsIndex, SimilarityGraph } from '../graphs/graphBuilder';

/**
 * Score components for each item
 */
export interface ItemScore {
  id: string;
  prerequisiteDepth: number;
  difficultyRelevance: number;
  thematicCohesion: number;
  compositeScore: number;
}

/**
 * ScoreCalculator class
 */
export class ScoreCalculator {
  private metadataPath: string;
  private graphsPath: string;
  private outputPath: string;
  private metadata: ExtractedMetadata | null = null;
  private dependencyGraph: DependencyGraph | null = null;
  private graphsIndex: GraphsIndex | null = null;

  /**
   * Constructor
   * @param metadataPath Path to metadata.json
   * @param graphsPath Path to graphs.json index file
   * @param outputPath Path to output scores.json
   */
  constructor(metadataPath: string, graphsPath: string, outputPath: string) {
    this.metadataPath = metadataPath;
    this.graphsPath = graphsPath;
    this.outputPath = outputPath;
  }

  /**
   * Calculate scores for all items
   */
  public async calculateScores(): Promise<Record<string, ItemScore>> {
    console.log('ScoreCalculator: Starting score calculation');
    
    // Load data
    await this.loadData();
    
    if (!this.metadata || !this.dependencyGraph) {
      throw new Error('ScoreCalculator: Failed to load required data');
    }
    
    console.log(`ScoreCalculator: Loaded metadata with ${this.metadata.items.length} items`);
    
    // Calculate prerequisite depth scores
    console.log('ScoreCalculator: Calculating prerequisite depth scores');
    const prerequisiteDepthScores = this.calculatePrerequisiteDepth();
    
    // Calculate difficulty and relevance scores
    console.log('ScoreCalculator: Calculating difficulty and relevance scores');
    const difficultyRelevanceScores = this.calculateDifficultyRelevance();
    
    // Calculate thematic cohesion scores
    console.log('ScoreCalculator: Calculating thematic cohesion scores');
    const thematicCohesionScores = await this.calculateThematicCohesion();
    
    // Combine scores
    console.log('ScoreCalculator: Combining scores');
    const scores: Record<string, ItemScore> = {};
    
    for (const item of this.metadata.items) {
      const id = item.id;
      
      // Get individual scores with fallbacks to 0
      const prerequisiteDepth = prerequisiteDepthScores[id] || 0;
      const difficultyRelevance = difficultyRelevanceScores[id] || 0;
      const thematicCohesion = thematicCohesionScores[id] || 0;
      
      // Calculate composite score with weights
      // 40% prerequisite depth, 40% difficulty/relevance, 20% thematic cohesion
      const compositeScore = 
        0.4 * prerequisiteDepth + 
        0.4 * difficultyRelevance + 
        0.2 * thematicCohesion;
      
      scores[id] = {
        id,
        prerequisiteDepth,
        difficultyRelevance,
        thematicCohesion,
        compositeScore
      };
    }
    
    // Save scores to file
    await this.saveScores(scores);
    
    return scores;
  }

  /**
   * Load required data
   */
  private async loadData(): Promise<void> {
    try {
      // Load metadata
      const metadataContent = await fs.promises.readFile(this.metadataPath, 'utf-8');
      this.metadata = JSON.parse(metadataContent);
      
      // Load graphs index
      const graphsIndexContent = await fs.promises.readFile(this.graphsPath, 'utf-8');
      this.graphsIndex = JSON.parse(graphsIndexContent);
      
      // Load dependency graph
      if (!this.graphsIndex) {
        throw new Error('ScoreCalculator: Graphs index not loaded');
      }
      
      const dependencyGraphContent = await fs.promises.readFile(
        this.graphsIndex.dependencyGraphPath, 
        'utf-8'
      );
      this.dependencyGraph = JSON.parse(dependencyGraphContent);
      
      // Note: We don't load the similarity graph here as it might be very large
      // Instead, we'll use a more efficient approach for thematic cohesion
    } catch (error) {
      console.error('ScoreCalculator: Error loading data:', error);
      throw error;
    }
  }

  /**
   * Calculate prerequisite depth scores using topological sort
   */
  private calculatePrerequisiteDepth(): Record<string, number> {
    if (!this.metadata || !this.dependencyGraph) {
      throw new Error('ScoreCalculator: Data not loaded');
    }
    
    const scores: Record<string, number> = {};
    const items = this.metadata.items;
    const nodes = this.dependencyGraph.nodes;
    const edges = this.dependencyGraph.edges;
    
    // Create adjacency list for topological sort
    const graph: Record<string, string[]> = {};
    for (const node of nodes) {
      graph[node.id] = [];
    }
    
    // Add edges to adjacency list
    for (const edge of edges) {
      if (edge.type === 'prerequisite') {
        // If A is a prerequisite for B, then B depends on A
        graph[edge.target].push(edge.source);
      }
    }
    
    // Calculate in-degree for each node
    const inDegree: Record<string, number> = {};
    for (const node of nodes) {
      inDegree[node.id] = 0;
    }
    
    for (const node of nodes) {
      for (const neighbor of graph[node.id]) {
        inDegree[neighbor]++;
      }
    }
    
    // Perform topological sort
    const queue: string[] = [];
    const depth: Record<string, number> = {};
    
    // Initialize queue with nodes having no dependencies
    for (const node of nodes) {
      if (inDegree[node.id] === 0) {
        queue.push(node.id);
        depth[node.id] = 0;
      }
    }
    
    // Process queue
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      // For each neighbor
      for (const neighbor of graph[current]) {
        inDegree[neighbor]--;
        
        // Update depth
        depth[neighbor] = Math.max(depth[neighbor] || 0, depth[current] + 1);
        
        // If all dependencies processed, add to queue
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    // Normalize depth scores to 0-1 range
    const maxDepth = Math.max(...Object.values(depth));
    
    if (maxDepth > 0) {
      for (const id in depth) {
        // Invert scores so that foundational items (depth 0) get highest score
        scores[id] = 1 - (depth[id] / maxDepth);
      }
    } else {
      // If no dependencies, all items get equal score
      for (const node of nodes) {
        scores[node.id] = 1;
      }
    }
    
    return scores;
  }

  /**
   * Calculate difficulty and relevance scores
   */
  private calculateDifficultyRelevance(): Record<string, number> {
    if (!this.metadata) {
      throw new Error('ScoreCalculator: Metadata not loaded');
    }
    
    const scores: Record<string, number> = {};
    
    for (const item of this.metadata.items) {
      let score = 0;
      
      // Complexity score (0-1)
      if (item.complexity !== undefined) {
        // Ensure complexity is treated as a number
        const complexityValue = Number(item.complexity);
        // Normalize complexity (typically 1-5) to 0-1
        const complexityScore = (complexityValue - 1) / 4;
        score += complexityScore * 0.3; // 30% weight
      }
      
      // Difficulty score (0-1)
      if (item.difficulty) {
        // Map difficulty enum to numeric value
        let difficultyValue = 0;
        switch (item.difficulty) {
          case 'easy': difficultyValue = 1; break;
          case 'medium': difficultyValue = 2; break;
          case 'hard': difficultyValue = 3; break;
        }
        
        // Normalize difficulty (1-3) to 0-1
        const difficultyScore = (difficultyValue - 1) / 2;
        score += difficultyScore * 0.3; // 30% weight
      }
      
      // Level score (0-1) - handle different item types
      if (item.type === 'question') {
        const questionItem = item as QuestionMetadata;
        if (questionItem.level) {
          // Convert difficulty level to numeric
          let levelValue = 0;
          switch (questionItem.level) {
            case 'easy': levelValue = 1; break;
            case 'medium': levelValue = 2; break;
            case 'hard': levelValue = 3; break;
          }
          
          // Normalize level (1-3) to 0-1
          const levelScore = (levelValue - 1) / 2;
          score += levelScore * 0.15; // 15% weight
        }
      }
      
      // Interview relevance score (0-1) - handle different item types
      if (item.type === 'theory' || item.type === 'task') {
        const theoryOrTask = item as TheoryMetadata | TaskMetadata;
        if (theoryOrTask.interviewRelevance !== undefined) {
          // Normalize interview relevance (typically 1-5) to 0-1
          const relevanceScore = (theoryOrTask.interviewRelevance - 1) / 4;
          score += relevanceScore * 0.15; // 15% weight
        }
      }
      
      // Interview frequency score (0-1) - only for question items
      if (item.type === 'question') {
        const questionItem = item as QuestionMetadata;
        if (questionItem.interviewFrequency !== undefined) {
          // Normalize interview frequency (typically 1-5) to 0-1
          const frequencyScore = (questionItem.interviewFrequency - 1) / 4;
          score += frequencyScore * 0.1; // 10% weight
        }
      }
      
      // Normalize score to ensure it's between 0-1
      scores[item.id] = Math.min(Math.max(score, 0), 1);
    }
    
    return scores;
  }

  /**
   * Calculate thematic cohesion scores
   * Uses a heuristic based on learning path and technology groups
   * instead of loading the full similarity graph
   */
  private async calculateThematicCohesion(): Promise<Record<string, number>> {
    if (!this.metadata) {
      throw new Error('ScoreCalculator: Metadata not loaded');
    }
    
    const scores: Record<string, number> = {};
    const items = this.metadata.items;
    
    // Group items by learning path
    const itemsByLearningPath: Record<string, MetadataItem[]> = {};
    for (const item of items) {
      if (item.learningPath) {
        const learningPath = item.learningPath;
        if (!itemsByLearningPath[learningPath]) {
          itemsByLearningPath[learningPath] = [];
        }
        itemsByLearningPath[learningPath].push(item);
      }
    }
    
    // Group items by technology tags
    const itemsByTechnologyTag: Record<string, MetadataItem[]> = {};
    for (const item of items) {
      if (item.technology && item.technology.length > 0) {
        for (const tech of item.technology) {
          const techKey = String(tech); // Convert tech to string for use as index
          if (!itemsByTechnologyTag[techKey]) {
            itemsByTechnologyTag[techKey] = [];
          }
          itemsByTechnologyTag[techKey].push(item);
        }
      }
    }
    
    // Calculate cohesion scores
    for (const item of items) {
      let score = 0;
      
      // Score based on learning path group size
      if (item.learningPath && itemsByLearningPath[item.learningPath]) {
        const groupSize = itemsByLearningPath[item.learningPath].length;
        const totalItems = items.length;
        
        // Items in smaller, focused learning paths get higher scores
        // Optimal group size is around 5-15% of total items
        const optimalRatio = 0.1; // 10% of total items
        const actualRatio = groupSize / totalItems;
        const learningPathScore = Math.max(0, 1 - Math.abs(actualRatio - optimalRatio) / optimalRatio);
        
        score += learningPathScore * 0.6; // 60% weight
      }
      
      // Score based on technology group size
      if (item.technology && item.technology.length > 0) {
        let techScore = 0;
        let techCount = 0;
        
        // Calculate average score across all technologies for this item
        for (const tech of item.technology) {
          const techKey = String(tech);
          if (itemsByTechnologyTag[techKey]) {
            const groupSize = itemsByTechnologyTag[techKey].length;
            const totalItems = items.length;
            
            // Items in smaller, focused technology groups get higher scores
            // Optimal group size is around 5-15% of total items
            const optimalRatio = 0.1; // 10% of total items
            const actualRatio = groupSize / totalItems;
            techScore += Math.max(0, 1 - Math.abs(actualRatio - optimalRatio) / optimalRatio);
            techCount++;
          }
        }
        
        // Average the technology scores
        if (techCount > 0) {
          score += (techScore / techCount) * 0.4; // 40% weight
        }
      }
      
      // Normalize score
      scores[item.id] = Math.min(Math.max(score, 0), 1);
    }
    
    return scores;
  }

  /**
   * Save scores to file
   */
  private async saveScores(scores: Record<string, ItemScore>): Promise<void> {
    // Ensure directory exists
    const outputDir = path.dirname(this.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    try {
      // Convert scores object to array for better readability
      const scoresArray = Object.values(scores);
      
      // Sort by composite score descending
      scoresArray.sort((a, b) => b.compositeScore - a.compositeScore);
      
      // Write to file
      await fs.promises.writeFile(
        this.outputPath,
        JSON.stringify({
          scores: scoresArray,
          metadata: {
            totalItems: scoresArray.length,
            timestamp: new Date().toISOString()
          }
        }, null, 2),
        'utf-8'
      );
      
      // Log file size
      const stats = fs.statSync(this.outputPath);
      const fileSizeMB = stats.size / (1024 * 1024);
      console.log(`ScoreCalculator: Scores file size: ${fileSizeMB.toFixed(2)} MB`);
    } catch (error) {
      console.error('ScoreCalculator: Error saving scores:', error);
      throw error;
    }
  }
}
