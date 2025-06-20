/**
 * Metadata Service
 * 
 * Frontend service for handling curriculum generation pipeline steps
 */
import { ExtractedMetadata } from '../types/metadata';
import { ProcessedChunkResult } from '../ai/analyzer';

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
   * Check if graphs files exist
   */
  public static async checkGraphsExist(): Promise<boolean> {
    try {
      console.log('MetadataService: Checking if graphs exist');
      const response = await fetch('/api/curriculum/check-graphs');
      const data = await response.json();
      console.log('MetadataService: Graphs exist:', data.exists);
      return data.exists;
    } catch (error) {
      console.error('MetadataService: Error checking graphs existence:', error);
      return false;
    }
  }
  
  /**
   * Check if scores.json exists
   */
  public static async checkScoresExist(): Promise<boolean> {
    try {
      console.log('MetadataService: Checking if scores exist');
      const response = await fetch('/api/curriculum/check-scores');
      const data = await response.json();
      console.log('MetadataService: Scores exist:', data.exists);
      return data.exists;
    } catch (error) {
      console.error('MetadataService: Error checking scores existence:', error);
      return false;
    }
  }
  
  /**
   * Check if AI-processed chunks exist
   */
  public static async checkChunksExist(): Promise<boolean> {
    try {
      console.log('MetadataService: Checking if AI-processed chunks exist');
      const response = await fetch('/api/curriculum/check-chunks');
      const data = await response.json();
      console.log('MetadataService: AI-processed chunks exist:', data.exists);
      return data.exists;
    } catch (error) {
      console.error('MetadataService: Error checking chunks existence:', error);
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
   * Get graph stats
   */
  public static async getGraphStats(): Promise<{
    nodeCount: number;
    dependencyEdgeCount: number;
    similarityEdgeCount: number;
  } | null> {
    try {
      console.log('MetadataService: Getting graph stats');
      const response = await fetch('/api/curriculum/read-graphs-index');
      
      if (!response.ok) {
        console.error('MetadataService: Failed to get graph stats:', response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log('MetadataService: Got graph stats:', data);
      
      if (data && data.data) {
        return {
          nodeCount: data.data.nodeCount || 0,
          dependencyEdgeCount: data.data.dependencyEdgeCount || 0,
          similarityEdgeCount: data.data.similarityEdgeCount || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('MetadataService: Error getting graph stats:', error);
      return null;
    }
  }
  
  /**
   * Get score stats
   */
  public static async getScoreStats(): Promise<{
    itemsScored: number;
    scoresPath: string;
  } | null> {
    try {
      console.log('MetadataService: Getting score stats');
      const response = await fetch('/api/curriculum/score-stats');
      
      if (!response.ok) {
        console.error('MetadataService: Failed to get score stats:', response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log('MetadataService: Got score stats:', data);
      
      return {
        itemsScored: data.itemsScored || 0,
        scoresPath: data.scoresPath || 'scores.json'
      };
    } catch (error) {
      console.error('MetadataService: Error getting score stats:', error);
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
  
  /**
   * Step 4: Process chunks with AI
   * Uses AI to process chunks of the database
   */
  public static async processChunks(): Promise<any> {
    try {
      console.log('MetadataService: Processing chunks with AI at', new Date().toISOString());
      console.log('MetadataService: Sending POST request to /api/curriculum/process-chunks');
      
      // Log environment variable availability (not the actual value for security)
      console.log('MetadataService: NEXT_PUBLIC_GEMINI_API_KEY exists:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      
      // Create request object for logging
      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      console.log('MetadataService: Request options:', JSON.stringify(requestOptions));
      
      // Send the request with detailed logging
      console.log('MetadataService: Sending fetch request at', new Date().toISOString());
      console.log('MetadataService: ⚠️ NOTE: Server-side logs will only appear in the terminal, not in the browser console');
      
      const response = await fetch('/api/curriculum/process-chunks', requestOptions);
      console.log('MetadataService: Received response at', new Date().toISOString());
      
      // Check if the request was initiated but no response was received
      if (!response) {
        console.error('MetadataService: ⚠️ No response received from server. Check terminal for server logs.');
        throw new Error('No response received from server');
      }
      
      console.log('MetadataService: API response status:', response.status);
      console.log('MetadataService: API response status text:', response.statusText);
      
      // Log headers without using iteration
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      console.log('MetadataService: API response headers:', JSON.stringify(headers));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('MetadataService: API error response:', errorText);
        throw new Error(`Failed to process chunks: ${response.statusText} - ${errorText}`);
      }
      
      console.log('MetadataService: Parsing response JSON');
      const data = await response.json();
      console.log('MetadataService: API response data:', JSON.stringify(data, null, 2));
      
      return data;
    } catch (error: any) {
      console.error('MetadataService: Error processing chunks:', error.message);
      console.error('MetadataService: Full error:', error);
      throw error;
    }
  }
}
