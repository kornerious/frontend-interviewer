/**
 * Curriculum Generation System
 * 
 * Main entry point for the curriculum generation process
 * Implements a multi-phase pipeline:
 * 1. Metadata extraction and initial analysis
 * 2. Building global foundational graphs
 * 3. Initial deterministic scoring
 * 4. AI-assisted clustering and sequencing
 * 5. Final aggregation and curriculum assembly
 * 6. Runtime adaptation
 */
import path from 'path';
import fs from 'fs';
import { MetadataExtractor } from './metadata/extractor';
import { GraphBuilder } from './graphs/graphBuilder';
import { ScoreCalculator } from './scoring/scoreCalculator';
import { ExtractedMetadata } from './types/metadata';
import { CurriculumPaths } from './utils/curriculumPaths';

/**
 * Main class for curriculum generation
 */
export class CurriculumGenerator {
  /**
   * Phase 1: Extract metadata from database.json
   * - Extract comprehensive metadata from nested curriculum items
   * - Focus only on essential fields as specified in requirements
   */
  public static async extractMetadata(): Promise<any> {
    console.log('CurriculumGenerator: Starting Phase 1: Metadata Extraction');
    
    try {
      // Get paths from CurriculumPaths utility
      const databasePath = CurriculumPaths.getDatabasePath();
      const outputPath = CurriculumPaths.getMetadataPath();
      
      console.log('CurriculumGenerator: Creating MetadataExtractor instance');
      const extractor = new MetadataExtractor(databasePath, outputPath);
      
      console.log('CurriculumGenerator: Calling extract method');
      const result = await extractor.extract();
      
      console.log('CurriculumGenerator: Phase 1 complete. Extracted metadata for', 
        result.stats.totalItems, 'items');
      return result;
    } catch (error) {
      console.error('CurriculumGenerator: Error during metadata extraction:', error);
      throw error;
    }
  }
  
  /**
   * Step 2: Build global foundational graphs
   * Creates dependency and similarity graphs from metadata
   */
  public static async buildGraphs(): Promise<any> {
    console.log('CurriculumGenerator: Starting Step 2 - Building Global Foundational Graphs');
    
    try {
      // Get paths from CurriculumPaths utility
      const metadataPath = CurriculumPaths.getMetadataPath();
      const graphsPath = CurriculumPaths.getGraphsPath();
      
      // Create GraphBuilder instance
      const graphBuilder = new GraphBuilder(metadataPath, graphsPath);
      
      // Build graphs
      const result = await graphBuilder.buildGraphs();
      
      // Read the graphs index file
      const graphsIndexContent = await fs.promises.readFile(graphsPath, 'utf-8');
      const graphsIndex = JSON.parse(graphsIndexContent);
      
      console.log('CurriculumGenerator: Completed Step 2 - Building Global Foundational Graphs');
      
      return {
        graphsIndex,
        graphsPath
      };
    } catch (error) {
      console.error('CurriculumGenerator: Error during graph building:', error);
      throw error;
    }
  }
  
  /**
   * Step 3: Calculate initial deterministic scores
   * Assigns composite scores to items based on prerequisite depth, difficulty, relevance, and thematic cohesion
   */
  public static async calculateScores(): Promise<any> {
    console.log('CurriculumGenerator: Starting Step 3 - Initial Deterministic Scoring');
    
    try {
      // Get paths from CurriculumPaths utility
      const metadataPath = CurriculumPaths.getMetadataPath();
      const graphsPath = CurriculumPaths.getGraphsPath();
      const scoresPath = CurriculumPaths.getScoresPath();
      
      // Create score calculator
      const scoreCalculator = new ScoreCalculator(metadataPath, graphsPath, scoresPath);
      
      // Calculate scores
      const scores = await scoreCalculator.calculateScores();
      
      console.log('CurriculumGenerator: Score calculation complete');
      
      return {
        itemsScored: Object.keys(scores).length,
        scoresPath
      };
    } catch (error) {
      console.error('CurriculumGenerator: Error during score calculation:', error);
      throw error;
    }
  }
  
  /**
   * Step 4: AI-assisted clustering and sequencing
   * Uses Gemini 2.5 Flash to analyze chunks of the database
   * Not implemented yet
   */
  public static async processChunks(): Promise<void> {
    console.log('CurriculumGenerator: Step 4 - AI-assisted clustering not yet implemented');
    // This will be implemented in a future update
  }
  
  /**
   * Phase 3: Final aggregation and curriculum assembly
   * - Merge AI-processed chunks
   * - Deduplicate items
   * - Resolve cross-chunk dependencies
   * - Optionally refine with AI
   * - Apply rule-based ordering
   * - Interleave related content
   * - Map indexes back to full objects
   * - Generate final curriculum.json
   */
  public static async aggregateAndAssemble(): Promise<void> {
    console.log('CurriculumGenerator: Starting Phase 3 - Final Aggregation and Assembly');
    
    try {
      // Ensure curriculum folder structure exists
      CurriculumPaths.ensureCurriculumStructure();
      
      const MAX_CHUNKS = 10; // Maximum number of chunks to process
      
      // Step 1: Merge chunks and resolve dependencies
      console.log('CurriculumGenerator: Step 1 - Merging chunks and resolving dependencies');
      const aggregator = new (await import('./aggregation/aggregator')).Aggregator({
        chunksProcessedPath: CurriculumPaths.getChunksProcessedPath(),
        chunksDir: CurriculumPaths.getChunksDir(),
        outputDir: CurriculumPaths.getCurriculumDir(),
        graphsPath: CurriculumPaths.getGraphsPath(),
        maxChunks: MAX_CHUNKS
      });
      
      await aggregator.aggregate();
      console.log('CurriculumGenerator: Chunks aggregated successfully');
      
      // Step 2: Optional AI refinement
      console.log('CurriculumGenerator: Step 2 - Optional AI refinement');
      const sequencer = new (await import('./aggregation/sequencer')).Sequencer({
        aggregatedItemsPath: CurriculumPaths.getAggregatedItemsPath(),
        outputDir: CurriculumPaths.getCurriculumDir()
      });
      
      await sequencer.refine();
      console.log('CurriculumGenerator: AI refinement complete');
      
      // Step 3: Rule-based ordering within modules
      console.log('CurriculumGenerator: Step 3 - Rule-based ordering');
      const orderer = new (await import('./aggregation/ruleBasedOrderer')).RuleBasedOrderer({
        itemsPath: CurriculumPaths.getRefinedItemsPath(),
        metadataPath: CurriculumPaths.getMetadataPath(),
        graphsPath: CurriculumPaths.getGraphsPath(),
        outputDir: CurriculumPaths.getCurriculumDir()
      });
      
      await orderer.order();
      console.log('CurriculumGenerator: Rule-based ordering complete');
      
      // Step 4: Content interleaving for pedagogical flow
      console.log('CurriculumGenerator: Step 4 - Content interleaving');
      const interleaver = new (await import('./aggregation/contentInterleaver')).ContentInterleaver({
        itemsPath: CurriculumPaths.getOrderedItemsPath(),
        metadataPath: CurriculumPaths.getMetadataPath(),
        outputDir: CurriculumPaths.getCurriculumDir()
      });
      
      await interleaver.interleave();
      console.log('CurriculumGenerator: Content interleaving complete');
      
      // Step 5: Final curriculum assembly
      console.log('CurriculumGenerator: Step 5 - Final curriculum assembly');
      const writer = new (await import('./aggregation/curriculumWriter')).CurriculumWriter({
        itemsPath: CurriculumPaths.getInterleavedItemsPath(),
        databasePath: CurriculumPaths.getDatabasePath(),
        outputPath: CurriculumPaths.getCurriculumPath()
      });
      
      await writer.writeCurriculum();
      console.log('CurriculumGenerator: Final curriculum generated successfully');
      
      console.log('CurriculumGenerator: Phase 3 completed successfully');
    } catch (error) {
      console.error('CurriculumGenerator: Error during aggregation and assembly:', error);
      throw error;
    }
  }
  
  /**
   * Phase 4: Runtime adaptation
   * - Not implemented yet
   * - Will track user performance and adapt curriculum
   */
  public static async adaptToUserProgress(): Promise<void> {
    console.log('Phase 4: Runtime adaptation not yet implemented');
    // This will be implemented in a future update
  }
  
  /**
   * Run the full curriculum generation pipeline
   */
  public static async generateCurriculum(): Promise<{
    metadata: any;
    graphs: any;
    scores: any;
  }> {
    try {
      // Step 1: Metadata extraction
      console.log('CurriculumGenerator: Starting full curriculum generation pipeline');
      const metadataResult = await this.extractMetadata();
      console.log('Step 1 complete:', metadataResult);
      
      // Step 2: Building global foundational graphs
      const graphsResult = await this.buildGraphs();
      console.log('Step 2 complete:', graphsResult);
      
      // Step 3: Initial deterministic scoring
      const scoresResult = await this.calculateScores();
      console.log('Step 3 complete:', scoresResult);
      
      // Step 4: AI-assisted clustering (placeholder)
      await this.processChunks();
      console.log('Step 4 placeholder complete');
      
      // Step 5: Aggregation and assembly (placeholder)
      await this.aggregateAndAssemble();
      console.log('Step 5 placeholder complete');
      
      // Step 6: Runtime adaptation (placeholder)
      await this.adaptToUserProgress();
      console.log('Step 6 placeholder complete');
      
      console.log('Curriculum generation complete');
      
      return {
        metadata: metadataResult,
        graphs: graphsResult,
        scores: scoresResult
      };
    } catch (error) {
      console.error('Error generating curriculum:', error);
      throw error;
    }
  }
}
