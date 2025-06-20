/**
 * Metadata Service
 * 
 * Frontend service for handling curriculum generation pipeline steps
 */
import { ExtractedMetadata } from '../types/metadata';

/**
 * Service for interacting with the curriculum generation API
 */
export class MetadataService {
  /**
   * Extract metadata from database.json
   */
  public static async extractMetadata(): Promise<any> {
    try {
      console.log('MetadataService: Starting metadata extraction');
      
      const response = await fetch('/api/curriculum/extract-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('MetadataService: API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('MetadataService: API error response:', errorText);
        throw new Error(`Failed to extract metadata: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('MetadataService: Extraction complete, received data:', data);
      
      // If we got a success response with stats, return it
      if (data.success && data.stats) {
        return {
          stats: {
            theoryItems: data.stats.theoryCount || 0,
            questionItems: data.stats.questionCount || 0,
            taskItems: data.stats.taskCount || 0,
            totalItems: data.stats.totalItems || 0
          },
          dependencyGraphSize: data.dependencyGraphSize,
          similarityGraphSize: data.similarityGraphSize,
          initialScoresCount: data.initialScoresCount,
          metadataPath: data.metadataPath
        };
      }
      
      // Otherwise, return the full metadata if available
      return data;
    } catch (error) {
      console.error('MetadataService: Error extracting metadata:', error);
      throw error;
    }
  }
  
  /**
   * Check if metadata.json exists
   */
  public static async checkMetadataExists(): Promise<boolean> {
    try {
      console.log('MetadataService: Checking if metadata exists');
      const response = await fetch('/api/curriculum/check-metadata');
      const data = await response.json();
      console.log('MetadataService: Metadata exists:', data.exists);
      return data.exists;
    } catch (error) {
      console.error('MetadataService: Error checking metadata existence:', error);
      return false;
    }
  }
  
  /**
   * Get metadata stats
   */
  public static async getMetadataStats(): Promise<{
    theoryItems: number;
    questionItems: number;
    taskItems: number;
    totalItems: number;
  } | null> {
    try {
      console.log('MetadataService: Getting metadata stats');
      const response = await fetch('/api/curriculum/metadata-stats');
      
      if (!response.ok) {
        console.error('MetadataService: Failed to get metadata stats:', response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log('MetadataService: Got metadata stats:', data);
      
      return {
        theoryItems: data.theoryCount || 0,
        questionItems: data.questionCount || 0,
        taskItems: data.taskCount || 0,
        totalItems: data.totalItems || 0
      };
    } catch (error) {
      console.error('MetadataService: Error getting metadata stats:', error);
      return null;
    }
  }
  
  /**
   * Step 2: Build global foundational graphs
   * Creates dependency and similarity graphs from metadata
   */
  public static async buildGraphs(): Promise<any> {
    try {
      console.log('MetadataService: Starting graph building');
      
      const response = await fetch('/api/curriculum/build-graphs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('MetadataService: API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('MetadataService: API error response:', errorText);
        throw new Error(`Failed to build graphs: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('MetadataService: Graph building complete, received data:', data);
      
      // Read the graphs.json file to get accurate stats
      try {
        const graphsIndexResponse = await fetch('/api/curriculum/read-graphs-index');
        if (graphsIndexResponse.ok) {
          const graphsIndex = await graphsIndexResponse.json();
          console.log('MetadataService: Read graphs index:', graphsIndex);
          
          if (graphsIndex && graphsIndex.data) {
            return {
              stats: {
                nodeCount: graphsIndex.data.nodeCount || 0,
                dependencyEdgeCount: graphsIndex.data.dependencyEdgeCount || 0,
                similarityEdgeCount: graphsIndex.data.similarityEdgeCount || 0
              },
              graphsPath: data.graphsPath
            };
          }
        }
      } catch (indexError) {
        console.error('MetadataService: Error reading graphs index:', indexError);
        // Continue with original response if index reading fails
      }
      
      // Fallback to API response if index reading fails
      return {
        stats: data.stats || {
          nodeCount: 0,
          dependencyEdgeCount: 0,
          similarityEdgeCount: 0
        },
        graphsPath: data.graphsPath
      };
    } catch (error) {
      console.error('MetadataService: Error building graphs:', error);
      throw error;
    }
  }
  
  /**
   * Step 3: Calculate initial deterministic scores
   * Assigns composite scores to items based on prerequisite depth, difficulty, relevance, and thematic cohesion
   */
  public static async calculateScores(): Promise<any> {
    try {
      console.log('MetadataService: Starting score calculation');
      
      const response = await fetch('/api/curriculum/calculate-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('MetadataService: API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('MetadataService: API error response:', errorText);
        throw new Error(`Failed to calculate scores: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('MetadataService: Score calculation complete, received data:', data);
      
      return {
        itemsScored: data.itemsScored,
        scoresPath: data.scoresPath
      };
    } catch (error) {
      console.error('MetadataService: Error calculating scores:', error);
      throw error;
    }
  }
}
