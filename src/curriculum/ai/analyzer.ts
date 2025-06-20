/**
 * Analyzer
 * 
 * Parses Gemini JSON responses into structured, ordered index arrays
 */
import fs from 'fs';
import path from 'path';

/**
 * Interface for a cluster item
 */
export interface ClusterItem {
  index: number;
  id: string;
  reason?: string;
}

/**
 * Interface for a thematic cluster
 */
export interface ThematicCluster {
  name: string;
  description: string;
  items: ClusterItem[];
}

/**
 * Interface for AI response
 */
export interface AIResponse {
  clusters: ThematicCluster[];
}

/**
 * Interface for processed chunk result
 */
export interface ProcessedChunkResult {
  chunkId: string;
  clusters: ThematicCluster[];
  itemCount: number;
  clusterCount: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Analyzer class
 * 
 * Responsible for parsing AI responses into structured data
 */
export class Analyzer {
  /**
   * Parse AI response into structured data
   * @param response Raw AI response
   * @returns Structured AI response
   */
  public parseResponse(response: any): AIResponse {
    console.log('Analyzer: Parsing AI response');
    
    // Validate response structure
    if (!response || !response.clusters || !Array.isArray(response.clusters)) {
      throw new Error('Analyzer: Invalid response format - missing clusters array');
    }
    
    // Validate each cluster
    for (let i = 0; i < response.clusters.length; i++) {
      const cluster = response.clusters[i];
      
      if (!cluster.name || typeof cluster.name !== 'string') {
        throw new Error(`Analyzer: Invalid cluster at index ${i} - missing or invalid name`);
      }
      
      if (!cluster.items || !Array.isArray(cluster.items)) {
        throw new Error(`Analyzer: Invalid cluster "${cluster.name}" - missing items array`);
      }
      
      // Validate each item in the cluster
      for (let j = 0; j < cluster.items.length; j++) {
        const item = cluster.items[j];
        
        if (typeof item.index !== 'number') {
          throw new Error(`Analyzer: Invalid item at index ${j} in cluster "${cluster.name}" - missing or invalid index`);
        }
        
        if (!item.id || typeof item.id !== 'string') {
          throw new Error(`Analyzer: Invalid item at index ${j} in cluster "${cluster.name}" - missing or invalid id`);
        }
      }
    }
    
    return response as AIResponse;
  }
  
  /**
   * Save processed chunk result to file
   * @param result Processed chunk result
   * @param outputDir Directory to save result
   * @returns Path to saved file
   */
  public saveChunkResult(
    result: ProcessedChunkResult,
    outputDir: string
  ): string {
    console.log(`Analyzer: Saving chunk result for ${result.chunkId}`);
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create output path
    const outputPath = path.join(outputDir, `${result.chunkId}.json`);
    
    // Write result to file
    fs.writeFileSync(
      outputPath,
      JSON.stringify(result, null, 2),
      'utf-8'
    );
    
    console.log(`Analyzer: Saved chunk result to ${outputPath}`);
    
    return outputPath;
  }
  
  /**
   * Process AI response for a chunk
   * @param response AI response
   * @param chunkId Chunk ID
   * @param startIndex Start index of chunk
   * @param endIndex End index of chunk
   * @returns Processed chunk result
   */
  public processChunkResponse(
    response: any,
    chunkId: string,
    startIndex: number,
    endIndex: number
  ): ProcessedChunkResult {
    console.log(`Analyzer: Processing response for chunk ${chunkId}`);
    
    // Parse the response
    const parsedResponse = this.parseResponse(response);
    
    // Create processed result
    const result: ProcessedChunkResult = {
      chunkId,
      clusters: parsedResponse.clusters,
      itemCount: parsedResponse.clusters.reduce((sum, cluster) => sum + cluster.items.length, 0),
      clusterCount: parsedResponse.clusters.length,
      startIndex,
      endIndex
    };
    
    console.log(`Analyzer: Processed ${result.itemCount} items in ${result.clusterCount} clusters`);
    
    return result;
  }
  
  /**
   * Extract ordered indexes from a processed chunk result
   * @param result Processed chunk result
   * @returns Array of ordered indexes
   */
  public extractOrderedIndexes(result: ProcessedChunkResult): number[] {
    const orderedIndexes: number[] = [];
    
    // Iterate through each cluster
    for (const cluster of result.clusters) {
      // Add indexes from this cluster
      for (const item of cluster.items) {
        orderedIndexes.push(item.index);
      }
    }
    
    return orderedIndexes;
  }
}
