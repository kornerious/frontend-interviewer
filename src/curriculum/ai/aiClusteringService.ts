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
  apiKey: process.env.GEMINI_API_KEY || '',
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
    console.log('AIClusteringService: Starting clustering process');
    
    // Step 1: Create chunks from database
    const chunks = await this.chunkManager.createChunks();
    console.log(`AIClusteringService: Created ${chunks.length} chunks`);
    
    // Step 2: Process each chunk with AI
    const chunkResults: ProcessedChunkResult[] = [];
    let totalItems = 0;
    let totalClusters = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`AIClusteringService: Processing chunk ${i + 1}/${chunks.length}: ${chunk.chunkId}`);
      
      try {
        // Read chunk data
        const chunkData = JSON.parse(fs.readFileSync(chunk.filePath, 'utf-8'));
        
        // Build prompt
        const prompt = this.promptBuilder.buildPrompt(
          chunkData,
          chunk.startIndex,
          chunk.endIndex
        );
        
        // Process with AI
        const aiResponse = await this.aiClient.processPrompt(prompt);
        
        // Analyze response
        const processedResult = this.analyzer.processChunkResponse(
          aiResponse,
          chunk.chunkId,
          chunk.startIndex,
          chunk.endIndex
        );
        
        // Save result
        this.analyzer.saveChunkResult(
          processedResult,
          this.config.resultsOutputDir
        );
        
        // Update totals
        chunkResults.push(processedResult);
        totalItems += processedResult.itemCount;
        totalClusters += processedResult.clusterCount;
        
        console.log(`AIClusteringService: Successfully processed chunk ${chunk.chunkId}`);
      } catch (error) {
        console.error(`AIClusteringService: Error processing chunk ${chunk.chunkId}:`, error);
        throw error;
      }
    }
    
    // Create summary file
    const summary = {
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
    
    const summaryPath = path.join(this.config.resultsOutputDir, 'clustering-summary.json');
    fs.writeFileSync(
      summaryPath,
      JSON.stringify(summary, null, 2),
      'utf-8'
    );
    
    console.log(`AIClusteringService: Completed clustering process. Summary saved to ${summaryPath}`);
    
    return {
      chunkCount: chunks.length,
      processedChunks: chunkResults.length,
      totalItems,
      totalClusters,
      chunkResults
    };
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
