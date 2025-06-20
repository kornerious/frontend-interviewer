/**
 * Graph Builder
 * 
 * Builds dependency and similarity graphs from extracted metadata
 */
import fs from 'fs';
import path from 'path';
import { ExtractedMetadata, MetadataItem } from '../types/metadata';

/**
 * Graph node representing a curriculum item
 */
export interface GraphNode {
  id: string;
  index: number;
  type: string;
  title: string;
}

/**
 * Directed edge for dependency graph
 */
export interface DependencyEdge {
  source: string;
  target: string;
  type: 'prerequisite' | 'requiredFor';
}

/**
 * Weighted undirected edge for similarity graph
 */
export interface SimilarityEdge {
  source: string;
  target: string;
  weight: number;
}

/**
 * Dependency graph structure
 */
export interface DependencyGraph {
  nodes: GraphNode[];
  edges: DependencyEdge[];
}

/**
 * Similarity graph structure
 */
export interface SimilarityGraph {
  nodes: GraphNode[];
  edges: SimilarityEdge[];
}

/**
 * Graph index file structure
 */
export interface GraphsIndex {
  dependencyGraphPath: string;
  similarityGraphPath: string;
  nodeCount: number;
  dependencyEdgeCount: number;
  similarityEdgeCount: number;
}

/**
 * GraphBuilder class
 * 
 * Builds dependency and similarity graphs from extracted metadata
 */
export class GraphBuilder {
  private metadataPath: string;
  private outputPath: string;
  private metadata: ExtractedMetadata | null = null;

  /**
   * Constructor
   * @param metadataPath Path to metadata.json
   * @param outputPath Path to output graphs.json
   */
  constructor(metadataPath: string, outputPath: string) {
    this.metadataPath = metadataPath;
    this.outputPath = outputPath;
  }

  /**
   * Build both dependency and similarity graphs
   */
  public async buildGraphs(): Promise<{ 
    dependencyGraph: DependencyGraph; 
    similarityGraph: SimilarityGraph;
    stats: {
      nodeCount: number;
      dependencyEdgeCount: number;
      similarityEdgeCount: number;
    }
  }> {
    console.log('GraphBuilder: Starting graph building process');
    
    // Load metadata
    await this.loadMetadata();
    
    if (!this.metadata) {
      throw new Error('GraphBuilder: Failed to load metadata');
    }
    
    console.log(`GraphBuilder: Loaded metadata with ${this.metadata.items.length} items`);
    
    // Build dependency graph
    console.log('GraphBuilder: Building dependency graph');
    const dependencyGraph = this.buildDependencyGraph();
    console.log(`GraphBuilder: Dependency graph built with ${dependencyGraph.edges.length} edges`);
    
    // Build similarity graph
    console.log('GraphBuilder: Building similarity graph');
    const similarityGraph = this.buildSimilarityGraph();
    console.log(`GraphBuilder: Similarity graph built with ${similarityGraph.edges.length} edges`);
    
    // Save graphs to file
    await this.saveGraphs(dependencyGraph, similarityGraph);
    
    return {
      dependencyGraph,
      similarityGraph,
      stats: {
        nodeCount: dependencyGraph.nodes.length,
        dependencyEdgeCount: dependencyGraph.edges.length,
        similarityEdgeCount: similarityGraph.edges.length
      }
    };
  }

  /**
   * Load metadata from file
   */
  private async loadMetadata(): Promise<void> {
    try {
      const data = await fs.promises.readFile(this.metadataPath, 'utf-8');
      this.metadata = JSON.parse(data);
    } catch (error) {
      console.error('GraphBuilder: Error loading metadata:', error);
      throw error;
    }
  }

  /**
   * Build dependency graph from metadata
   */
  private buildDependencyGraph(): DependencyGraph {
    if (!this.metadata) {
      throw new Error('GraphBuilder: Metadata not loaded');
    }

    const nodes: GraphNode[] = [];
    const edges: DependencyEdge[] = [];
    const items = this.metadata.items;
    
    // Create nodes for all items
    for (const item of items) {
      nodes.push({
        id: item.id,
        index: item.index,
        type: item.type,
        title: item.title
      });
    }
    
    // Create edges for prerequisites
    for (const item of items) {
      // Handle prerequisites field (item is target, prerequisite is source)
      if (item.prerequisites && Array.isArray(item.prerequisites)) {
        for (const prerequisiteId of item.prerequisites) {
          // Verify the prerequisite exists in our items
          const prerequisiteItem = items.find(i => i.id === prerequisiteId);
          if (prerequisiteItem) {
            edges.push({
              source: prerequisiteId,
              target: item.id,
              type: 'prerequisite'
            });
          }
        }
      }
      
      // Handle requiredFor field (item is source, requiredFor is target)
      if (item.requiredFor && Array.isArray(item.requiredFor)) {
        for (const requiredForId of item.requiredFor) {
          // Verify the requiredFor exists in our items
          const requiredForItem = items.find(i => i.id === requiredForId);
          if (requiredForItem) {
            edges.push({
              source: item.id,
              target: requiredForId,
              type: 'requiredFor'
            });
          }
        }
      }
    }
    
    return { nodes, edges };
  }

  /**
   * Build similarity graph from metadata
   */
  private buildSimilarityGraph(): SimilarityGraph {
    if (!this.metadata) {
      throw new Error('GraphBuilder: Metadata not loaded');
    }

    const nodes: GraphNode[] = [];
    const edges: SimilarityEdge[] = [];
    const items = this.metadata.items;
    
    // Create nodes for all items
    for (const item of items) {
      nodes.push({
        id: item.id,
        index: item.index,
        type: item.type,
        title: item.title
      });
    }
    
    // Group items by learningPath to reduce the number of comparisons
    const itemsByLearningPath: Record<string, MetadataItem[]> = {};
    
    for (const item of items) {
      if (item.learningPath) {
        if (!itemsByLearningPath[item.learningPath]) {
          itemsByLearningPath[item.learningPath] = [];
        }
        itemsByLearningPath[item.learningPath].push(item);
      }
    }
    
    console.log(`GraphBuilder: Created ${Object.keys(itemsByLearningPath).length} learning path groups`);
    
    // Set a high similarity threshold to reduce edge count
    const SIMILARITY_THRESHOLD = 0.8;
    const MAX_EDGES = 10000;
    
    // Calculate similarity edges within each learning path group
    for (const learningPath of Object.keys(itemsByLearningPath)) {
      const groupItems = itemsByLearningPath[learningPath];
      
      // Skip very large groups to avoid combinatorial explosion
      if (groupItems.length > 100) {
        console.log(`GraphBuilder: Skipping large learning path group "${learningPath}" with ${groupItems.length} items`);
        continue;
      }
      
      console.log(`GraphBuilder: Processing learning path group "${learningPath}" with ${groupItems.length} items`);
      
      // Compare each pair of items in the group
      for (let i = 0; i < groupItems.length; i++) {
        const itemA = groupItems[i];
        
        for (let j = i + 1; j < groupItems.length; j++) {
          const itemB = groupItems[j];
          
          // Skip if items don't share at least one tag
          const hasCommonTag = this.hasCommonElement(
            itemA.tags || [], 
            itemB.tags || []
          );
          
          if (!hasCommonTag) {
            continue;
          }
          
          // Calculate similarity weight
          const weight = this.calculateSimilarity(itemA, itemB);
          
          // Only add edge if similarity is above threshold
          if (weight >= SIMILARITY_THRESHOLD) {
            edges.push({
              source: itemA.id,
              target: itemB.id,
              weight
            });
            
            // Check if we've reached the maximum number of edges
            if (edges.length >= MAX_EDGES) {
              console.log(`GraphBuilder: Reached maximum edge count of ${MAX_EDGES}`);
              return { nodes, edges };
            }
          }
        }
      }
    }
    
    console.log(`GraphBuilder: Created ${edges.length} similarity edges`);
    return { nodes, edges };
  }

  /**
   * Calculate similarity between two items
   */
  private calculateSimilarity(itemA: MetadataItem, itemB: MetadataItem): number {
    let score = 0;
    
    // Base score for same learning path
    if (itemA.learningPath && itemB.learningPath && itemA.learningPath === itemB.learningPath) {
      score += 0.5;
    }
    
    // Score for shared tags
    const sharedTags = this.countCommonElements(
      itemA.tags || [], 
      itemB.tags || []
    );
    score += sharedTags * 0.1;
    
    // Score for shared technology
    if (itemA.technology && itemB.technology && itemA.technology === itemB.technology) {
      score += 0.2;
    }
    
    // Score for shared related concepts
    const sharedConcepts = this.countCommonElements(
      itemA.relatedConcepts || [], 
      itemB.relatedConcepts || []
    );
    score += sharedConcepts * 0.1;
    
    // Score for shared key concepts
    const sharedKeyConcepts = this.countCommonElements(
      itemA.keyConcepts || [], 
      itemB.keyConcepts || []
    );
    score += sharedKeyConcepts * 0.1;
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Count common elements between two arrays
   */
  private countCommonElements(arrA: string[], arrB: string[]): number {
    if (!arrA.length || !arrB.length) return 0;
    
    const setB = new Set(arrB);
    return arrA.filter(item => setB.has(item)).length;
  }
  
  /**
   * Check if two arrays have at least one common element
   */
  private hasCommonElement(arrA: string[], arrB: string[]): boolean {
    if (!arrA.length || !arrB.length) return false;
    
    const setB = new Set(arrB);
    return arrA.some(item => setB.has(item));
  }

  /**
   * Save graphs to file
   */
  private async saveGraphs(dependencyGraph: DependencyGraph, similarityGraph: SimilarityGraph): Promise<void> {
    // Ensure directory exists
    const outputDir = path.dirname(this.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Get base path without extension
    const basePath = this.outputPath.replace(/\.json$/, '');
    
    try {
      // Save dependency graph to its own file
      const dependencyGraphPath = `${basePath}-dependency.json`;
      console.log(`GraphBuilder: Saving dependency graph to ${dependencyGraphPath}`);
      await fs.promises.writeFile(
        dependencyGraphPath,
        JSON.stringify(dependencyGraph, null, 2),
        'utf-8'
      );
      
      // Save similarity graph to its own file - with chunking to avoid memory issues
      const similarityGraphPath = `${basePath}-similarity.json`;
      console.log(`GraphBuilder: Saving similarity graph to ${similarityGraphPath}`);
      
      // Write similarity graph in chunks
      // First write the opening and nodes
      const writer = fs.createWriteStream(similarityGraphPath, { encoding: 'utf-8' });
      writer.write('{\n');
      writer.write('  "nodes": ' + JSON.stringify(similarityGraph.nodes) + ',\n');
      writer.write('  "edges": [\n');
      
      // Write edges in chunks
      const edges = similarityGraph.edges;
      const CHUNK_SIZE = 1000;
      
      for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const isLast = i === edges.length - 1;
        
        // Write edge
        writer.write('    ' + JSON.stringify(edge) + (isLast ? '\n' : ',\n'));
        
        // Log progress for large edge sets
        if ((i + 1) % CHUNK_SIZE === 0 || isLast) {
          console.log(`GraphBuilder: Wrote ${i + 1}/${edges.length} similarity edges`);
        }
      }
      
      // Close the JSON structure
      writer.write('  ]\n');
      writer.write('}\n');
      
      // Close the stream
      await new Promise<void>((resolve, reject) => {
        writer.end((err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });
      
      // Create a small index file that references the two graph files
      const graphsIndex: GraphsIndex = {
        dependencyGraphPath,
        similarityGraphPath,
        nodeCount: dependencyGraph.nodes.length,
        dependencyEdgeCount: dependencyGraph.edges.length,
        similarityEdgeCount: similarityGraph.edges.length
      };
      
      // Write the index file
      await fs.promises.writeFile(
        this.outputPath,
        JSON.stringify(graphsIndex, null, 2),
        'utf-8'
      );
      
      // Log file sizes
      const dependencyStats = fs.statSync(dependencyGraphPath);
      const dependencyFileSizeMB = dependencyStats.size / (1024 * 1024);
      console.log(`GraphBuilder: Dependency graph file size: ${dependencyFileSizeMB.toFixed(2)} MB`);
      
      const similarityStats = fs.statSync(similarityGraphPath);
      const similarityFileSizeMB = similarityStats.size / (1024 * 1024);
      console.log(`GraphBuilder: Similarity graph file size: ${similarityFileSizeMB.toFixed(2)} MB`);
      
      const indexStats = fs.statSync(this.outputPath);
      const indexFileSizeMB = indexStats.size / (1024 * 1024);
      console.log(`GraphBuilder: Graphs index file size: ${indexFileSizeMB.toFixed(2)} MB`);
    } catch (error) {
      console.error('GraphBuilder: Error saving graphs:', error);
      throw error;
    }
  }
}
