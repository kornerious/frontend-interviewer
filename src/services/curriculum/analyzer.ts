import { MetadataItem } from './metadataExtractor';
import { AIClusteringResult } from './aiClient';
import { ChunkData } from './chunkManager';

export interface Cluster {
  name: string;
  technology: string;
  learningPath: string;
  items: {
    id: string;
    index: number;
    score: number;
  }[];
}

/**
 * Phase 3: Final Aggregation, Refinement, and Assembly
 * Analyzer component for parsing AI results
 */
export class Analyzer {
  /**
   * Parse AI clustering results and map them back to metadata items
   */
  parseClusteringResult(
    result: AIClusteringResult,
    chunk: ChunkData
  ): Cluster[] {
    const clusters: Cluster[] = [];
    
    // Process each cluster from the AI result
    for (const clusterData of result.clusters) {
      const clusterItems = clusterData.itemIndexes.map(index => {
        // Map the index to the actual metadata item
        const relativeIndex = index - chunk.startIndex;
        if (relativeIndex < 0 || relativeIndex >= chunk.items.length) {
          console.warn(`Invalid item index ${index} in cluster ${clusterData.name}`);
          return null;
        }
        
        const item = chunk.items[relativeIndex];
        return {
          id: item.id,
          index: item.index,
          score: item.score
        };
      }).filter(Boolean); // Remove null items
      
      clusters.push({
        name: clusterData.name,
        technology: clusterData.technology,
        learningPath: clusterData.learningPath,
        items: clusterItems
      });
    }
    
    return clusters;
  }
  
  /**
   * Validate clusters for consistency and completeness
   */
  validateClusters(
    clusters: Cluster[],
    metadata: MetadataItem[]
  ): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for empty clusters
    const emptyClusters = clusters.filter(c => c.items.length === 0);
    if (emptyClusters.length > 0) {
      issues.push(`Found ${emptyClusters.length} empty clusters`);
    }
    
    // Check for duplicate items across clusters
    const itemsById = new Map<string, string>();
    for (const cluster of clusters) {
      for (const item of cluster.items) {
        if (itemsById.has(item.id)) {
          issues.push(`Item ${item.id} appears in multiple clusters: ${itemsById.get(item.id)} and ${cluster.name}`);
        } else {
          itemsById.set(item.id, cluster.name);
        }
      }
    }
    
    // Check for missing items
    const allClusteredItems = new Set(Array.from(itemsById.keys()));
    const missingItems = metadata.filter(item => !allClusteredItems.has(item.id));
    if (missingItems.length > 0) {
      issues.push(`${missingItems.length} items are not assigned to any cluster`);
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}
