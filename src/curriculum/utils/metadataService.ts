/**
 * Metadata Service
 * 
 * Frontend service for handling metadata extraction and processing
 */
import { ExtractedMetadata } from '../types/metadata';

/**
 * Service for interacting with the metadata API
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
}
