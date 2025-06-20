/**
 * AIClusteringService
 * 
 * Orchestrates the AI-assisted clustering process
 */
import fs from 'fs';
import path from 'path';
import { ChunkManager, ChunkMetadata } from '../chunks/chunkManager';
import { PromptBuilder } from './promptBuilder';
import { AIClient } from './aiClient';
import { Analyzer, ProcessedChunkResult } from './analyzer';

/**
 * Configuration for AI clustering service
 */
export interface AIClusteringConfig {
  databasePath: string;
  chunksOutputDir: string;
  resultsOutputDir: string;
  chunkPrefix: string;
  apiKey: string;
  model: string;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AIClusteringConfig = {
  databasePath: path.join(process.cwd(), 'database.json'),
  chunksOutputDir: path.join(process.cwd(), 'curriculum', 'chunks'),
  resultsOutputDir: path.join(process.cwd(), 'curriculum', 'results'),
  chunkPrefix: 'chunk',
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
  model: 'gemini-2.5-flash-preview-05-20'
};

/**
 * AIClusteringService class
 * 
 * Manages the end-to-end process of AI-assisted clustering
 */
export class AIClusteringService {
  private config: AIClusteringConfig;
  private chunkManager: ChunkManager;
  private promptBuilder: PromptBuilder;
  private aiClient: AIClient;
  private analyzer: Analyzer;
  
  /**
   * Constructor
   * @param config Service configuration
   */
  constructor(config: Partial<AIClusteringConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize components
    this.chunkManager = new ChunkManager(
      this.config.databasePath,
      this.config.chunksOutputDir,
      this.config.chunkPrefix
    );
    
    this.promptBuilder = new PromptBuilder();
    
    this.aiClient = new AIClient({
      apiKey: this.config.apiKey,
      model: this.config.model
    });
    
    this.analyzer = new Analyzer();
    
    console.log('AIClusteringService: Initialized with configuration', {
      databasePath: this.config.databasePath,
      chunksOutputDir: this.config.chunksOutputDir,
      resultsOutputDir: this.config.resultsOutputDir
    });
  }
  
  /**
   * Run the complete AI clustering process
   * @returns Summary of processing results
   */
  public async runClustering(): Promise<{
    chunkCount: number;
    processedChunks: number;
    totalItems: number;
    totalClusters: number;
    chunkResults: ProcessedChunkResult[];
  }> {
    try {
      console.log('AIClusteringService: Starting clustering process at', new Date().toISOString());
      
      // Step 1: Create chunks from database
      console.log('AIClusteringService: Creating chunks');
      console.log('AIClusteringService: Database path:', this.config.databasePath);
      console.log('AIClusteringService: Chunks output directory:', this.config.chunksOutputDir);
      
      const chunks = await this.chunkManager.createChunks();
      console.log(`AIClusteringService: Created ${chunks.length} chunks`);
      console.log('AIClusteringService: Chunk details:', chunks.map(c => ({ 
        chunkId: c.chunkId, 
        itemCount: c.itemCount, 
        filePath: c.filePath 
      })));
      
      // Step 2: Process each chunk with AI
      console.log('AIClusteringService: Processing chunks with AI at', new Date().toISOString());
      console.log('AIClusteringService: Using API key:', this.config.apiKey ? '****' + this.config.apiKey.substring(this.config.apiKey.length - 4) : 'undefined');
      console.log('AIClusteringService: Using model:', this.config.model);
      
      const chunkResults: ProcessedChunkResult[] = [];
      let totalItems = 0;
      let totalClusters = 0;
      
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`AIClusteringService: Processing chunk ${i + 1}/${chunks.length}: ${chunk.chunkId}`);
        
        try {
          // Read chunk data
          const chunkData = JSON.parse(fs.readFileSync(chunk.filePath, 'utf-8'));
          console.log(`AIClusteringService: Read chunk data from ${chunk.filePath}, size: ${JSON.stringify(chunkData).length} bytes`);
          
          // Build prompt
          console.log('AIClusteringService: Building prompt for chunk');
          const prompt = this.promptBuilder.buildPrompt(
            chunkData,
            chunk.startIndex,
            chunk.endIndex
          );
          console.log(`AIClusteringService: Built prompt, length: ${prompt.length} characters`);
          
          // Process with AI with validation and retry logic
          console.log(`AIClusteringService: Sending prompt to AI at ${new Date().toISOString()}`);
          
          let aiResponse;
          let processedResult;
          let isValidResponse = false;
          let attemptCount = 0;
          const MAX_ATTEMPTS = 3; // Initial attempt + 2 retries
          
          // Expected number of items in this chunk
          const expectedItemCount = chunk.endIndex - chunk.startIndex + 1;
          console.log(`AIClusteringService: Expecting ${expectedItemCount} items in response`);
          
          while (!isValidResponse && attemptCount < MAX_ATTEMPTS) {
            attemptCount++;
            console.log(`AIClusteringService: Attempt ${attemptCount} of ${MAX_ATTEMPTS}`);
            
            // Send the prompt to the AI
            aiResponse = await this.aiClient.processPrompt(prompt);
            console.log(`AIClusteringService: Received AI response at ${new Date().toISOString()}`);
            
            try {
              // Try to analyze the response
              processedResult = this.analyzer.processChunkResponse(
                aiResponse,
                chunk.chunkId,
                chunk.startIndex,
                chunk.endIndex
              );
              
              // Get all indexes from the response
              const includedIndexes = this.analyzer.extractOrderedIndexes(processedResult);
              
              // Verify all expected indexes are present
              if (includedIndexes.length === expectedItemCount) {
                // Create a Set of all indexes for O(1) lookup
                const indexSet = new Set(includedIndexes);
                
                // Check if all indexes in range are present
                let missingIndexes = [];
                for (let idx = chunk.startIndex; idx <= chunk.endIndex; idx++) {
                  if (!indexSet.has(idx)) {
                    missingIndexes.push(idx);
                  }
                }
                
                if (missingIndexes.length === 0) {
                  console.log(`AIClusteringService: Response validation successful - all ${expectedItemCount} items present`);
                  isValidResponse = true;
                } else {
                  console.warn(`AIClusteringService: Response missing indexes: ${missingIndexes.join(', ')}`);
                }
              } else {
                console.warn(`AIClusteringService: Response has ${includedIndexes.length} items, expected ${expectedItemCount}`);
              }
            } catch (error) {
              console.error(`AIClusteringService: Error analyzing response (attempt ${attemptCount}):`, error);
            }
            
            // If response is not valid and we have attempts left, try again
            if (!isValidResponse && attemptCount < MAX_ATTEMPTS) {
              console.log(`AIClusteringService: Retrying AI request (attempt ${attemptCount + 1} of ${MAX_ATTEMPTS})`);
            }
          }
          
          // If we've exhausted all attempts and still don't have a valid response, throw an error
          if (!isValidResponse || !processedResult) {
            throw new Error(`Failed to get valid response after ${MAX_ATTEMPTS} attempts. Response missing required items.`);
          }
          
          console.log(`AIClusteringService: Successfully validated response after ${attemptCount} attempt(s)`);
          
          // Analysis already completed during validation
          console.log('AIClusteringService: Analysis completed during validation');
          
          // Save result
          console.log(`AIClusteringService: Saving result to ${this.config.resultsOutputDir}`);
          this.analyzer.saveChunkResult(
            processedResult,
            this.config.resultsOutputDir
          );
          
          // Update totals
          chunkResults.push(processedResult);
          totalItems += processedResult.itemCount;
          totalClusters += processedResult.clusterCount;
          
          console.log(`AIClusteringService: Successfully processed chunk ${chunk.chunkId}`);
          console.log(`AIClusteringService: Found ${processedResult.clusterCount} clusters for ${processedResult.itemCount} items`);
        } catch (error) {
          console.error(`AIClusteringService: Error processing chunk ${chunk.chunkId}:`, error);
          throw error;
        }
      }
      
      // Create summary file
      const summary = {
        timestamp: new Date().toISOString(),
        chunkCount: chunks.length,
        processedChunks: chunkResults.length,
        totalItems,
        totalClusters,
        chunks: chunkResults.map(result => ({
          chunkId: result.chunkId,
          itemCount: result.itemCount,
          clusterCount: result.clusterCount
        }))
      };
      
      // Create the results directory if it doesn't exist
      if (!fs.existsSync(this.config.resultsOutputDir)) {
        fs.mkdirSync(this.config.resultsOutputDir, { recursive: true });
      }

      const summaryPath = path.join(this.config.resultsOutputDir, 'clustering-summary.json');
      fs.writeFileSync(
        summaryPath,
        JSON.stringify(summary, null, 2),
        'utf-8'
      );
      
      // Also write a copy to the root directory for easy detection
      const rootSummaryPath = path.join(process.cwd(), 'chunks-processed.json');
      fs.writeFileSync(
        rootSummaryPath,
        JSON.stringify(summary, null, 2),
        'utf-8'
      );
      
      console.log(`AIClusteringService: Completed clustering process at ${new Date().toISOString()}`);
      console.log(`AIClusteringService: Summary saved to ${summaryPath} and ${rootSummaryPath}`);
      
      return {
        chunkCount: chunks.length,
        processedChunks: chunkResults.length,
        totalItems,
        totalClusters,
        chunkResults
      };
    } catch (error) {
      console.error('AIClusteringService: Error in clustering process:', error);
      throw error;
    }
  }
  
  /**
   * Update the service configuration
   * @param config New configuration (partial)
   */
  public updateConfig(config: Partial<AIClusteringConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update component configurations if needed
    if (config.databasePath || config.chunksOutputDir || config.chunkPrefix) {
      this.chunkManager = new ChunkManager(
        this.config.databasePath,
        this.config.chunksOutputDir,
        this.config.chunkPrefix
      );
    }
    
    if (config.apiKey || config.model) {
      this.aiClient.updateConfig({
        apiKey: this.config.apiKey,
        model: this.config.model
      });
    }
  }
}
