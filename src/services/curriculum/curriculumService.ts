import { TheoryItem, QuestionItem, TaskItem, Module } from '@/types';
import { extractMetadata, MetadataItem, extractAndSaveMetadata } from './metadataExtractor';
import { buildGraphs, DependencyGraph, SimilarityGraph } from './graphBuilder';
import { scoreItems } from './scorer';
import { ChunkManager, ChunkData } from './chunkManager';
import { AIClient, AIClusteringResult } from './aiClient';
import { Analyzer, Cluster } from './analyzer';
import { Aggregator } from './aggregator';
import { Sequencer } from './sequencer';
import { Writer } from './writer';

export interface CurriculumGenerationProgress {
  phase: number;
  step: number;
  message: string;
  progress: number;
  error?: string;
}

export interface CurriculumGenerationOptions {
  useAI: boolean;
  saveToFirestore: boolean;
  onProgress?: (progress: CurriculumGenerationProgress) => void;
}

export interface CurriculumGenerationResult {
  modules: Module[];
  stats: {
    totalItems: number;
    totalModules: number;
    processingTimeMs: number;
    aiProcessingTimeMs?: number;
  };
}

/**
 * Main service for curriculum generation
 */
export class CurriculumService {
  private readonly apiKey: string;
  
  constructor(apiKey: string = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '') {
    this.apiKey = apiKey;
  }
  
  /**
   * Generate a curriculum from the database
   */
  async generateCurriculum(
    theoryItems: TheoryItem[],
    questionItems: QuestionItem[],
    taskItems: TaskItem[],
    options: CurriculumGenerationOptions = { useAI: true, saveToFirestore: true }
  ): Promise<CurriculumGenerationResult> {
    const startTime = Date.now();
    let aiStartTime = 0;
    let aiEndTime = 0;
    
    const { onProgress } = options;
    const updateProgress = (phase: number, step: number, message: string, progress: number) => {
      onProgress?.({
        phase,
        step,
        message,
        progress
      });
    };
    
    try {
      // Phase 1: Foundational Data Preparation & Analysis
      updateProgress(1, 1, 'Extracting metadata from all items and creating metadata.json', 0);
      
      // Step 1: Extract metadata and create metadata.json file
      // First extract and save metadata to file
      try {
        extractAndSaveMetadata();
        updateProgress(1, 1, 'Metadata saved to metadata.json', 50);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during metadata extraction';
        updateProgress(1, 1, `Error creating metadata.json: ${errorMessage}`, 0);
        throw error;
      }
      
      // Then extract metadata for in-memory processing
      updateProgress(1, 1, 'Extracting metadata for processing', 75);
      const metadata = extractMetadata(theoryItems, questionItems, taskItems);
      updateProgress(1, 1, 'Metadata extraction complete', 100);
      
      updateProgress(1, 2, 'Building dependency and similarity graphs', 0);
      const { dependencyGraph, similarityGraph } = buildGraphs(metadata);
      updateProgress(1, 2, 'Graph building complete', 100);
      
      updateProgress(1, 3, 'Performing initial deterministic scoring', 0);
      const scoredItems = scoreItems(metadata, dependencyGraph);
      updateProgress(1, 3, 'Initial scoring complete', 100);
      
      let clusters: Cluster[] = [];
      
      if (options.useAI && this.apiKey) {
        // Phase 2: AI-Assisted Clustering & Sequencing
        aiStartTime = Date.now();
        
        updateProgress(2, 4, 'Creating chunks from database items', 0);
        const chunkManager = new ChunkManager();
        const chunks = chunkManager.createChunks(scoredItems, theoryItems, questionItems, taskItems);
        updateProgress(2, 4, 'Chunk creation complete', 100);
        
        updateProgress(2, 5, 'Processing chunks with Gemini API', 0);
        const aiClient = new AIClient(this.apiKey);
        const analyzer = new Analyzer();
        
        // Process each chunk
        const chunkResults: Cluster[][] = [];
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          updateProgress(2, 5, `Processing chunk ${i + 1}/${chunks.length}`, (i / chunks.length) * 100);
          
          try {
            const result = await aiClient.processChunk(
              chunk,
              msg => updateProgress(2, 5, msg, ((i + 0.5) / chunks.length) * 100)
            );
            
            const parsedClusters = analyzer.parseClusteringResult(result, chunk);
            chunkResults.push(parsedClusters);
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            updateProgress(2, 5, `Error processing chunk ${i + 1}: ${errorMessage}`, ((i + 1) / chunks.length) * 100);
            // Continue with other chunks
          }
        }
        
        updateProgress(2, 5, 'All chunks processed', 100);
        
        // Phase 3: Final Aggregation, Refinement, and Assembly
        updateProgress(3, 6, 'Merging and resolving dependencies', 0);
        const aggregator = new Aggregator();
        const mergedClusters = aggregator.mergeClusters(chunkResults);
        const resolvedClusters = aggregator.resolveDependencies(mergedClusters, dependencyGraph, scoredItems);
        updateProgress(3, 6, 'Merging and dependency resolution complete', 100);
        
        updateProgress(3, 7, 'Performing final AI refinement pass', 0);
        const sequencer = new Sequencer(this.apiKey);
        const refinedClusters = await sequencer.refineSequence(
          resolvedClusters,
          scoredItems,
          msg => updateProgress(3, 7, msg, 50)
        );
        updateProgress(3, 7, 'Final AI refinement complete', 100);
        
        updateProgress(3, 8, 'Performing final rule-based ordering within modules', 0);
        const orderedClusters = sequencer.orderItemsWithinClusters(
          refinedClusters,
          dependencyGraph,
          scoredItems,
          msg => updateProgress(3, 8, msg, 50)
        );
        updateProgress(3, 8, 'Final ordering complete', 100);
        
        clusters = orderedClusters;
        aiEndTime = Date.now();
      } else {
        // Fallback to deterministic clustering if AI is not used
        updateProgress(3, 6, 'Using deterministic clustering (AI disabled)', 0);
        
        // Group items by technology and learning path
        const groupedItems = new Map<string, MetadataItem[]>();
        for (const item of scoredItems) {
          const key = `${item.technology || 'general'}-${item.learningPath}`;
          if (!groupedItems.has(key)) {
            groupedItems.set(key, []);
          }
          const itemGroup = groupedItems.get(key);
          if (itemGroup) {
            itemGroup.push(item);
          }
        }
        
        // Create clusters from groups
        const deterministicClusters: Cluster[] = [];
        for (const entry of Array.from(groupedItems.entries())) {
          const [key, items] = entry;
          const [technology, learningPath] = key.split('-');
          
          // Get the most common tags to name the cluster
          const tagCounts = new Map<string, number>();
          for (const item of items as MetadataItem[]) {
            for (const tag of item.tags) {
              tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
            }
          }
          
          const sortedTags = Array.from(tagCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([tag]) => tag);
          
          const name = sortedTags.length > 0
            ? `${technology} ${sortedTags.join(' & ')}`
            : `${technology} ${learningPath}`;
          
          deterministicClusters.push({
            name,
            technology,
            learningPath,
            items: items.map(item => ({
              id: item.id,
              index: item.index,
              score: item.score
            }))
          });
        }
        
        // Apply deterministic ordering
        const sequencer = new Sequencer();
        const orderedClusters = sequencer.orderItemsWithinClusters(
          deterministicClusters,
          dependencyGraph,
          scoredItems,
          msg => updateProgress(3, 8, msg, 50)
        );
        
        clusters = orderedClusters;
        updateProgress(3, 8, 'Deterministic clustering complete', 100);
      }
      
      // Step 9: Interleave Content for Pedagogical Flow
      updateProgress(3, 9, 'Interleaving related content', 0);
      const writer = new Writer();
      const interleavedClusters = writer.interleaveRelatedContent(
        clusters,
        theoryItems,
        questionItems,
        taskItems,
        msg => updateProgress(3, 9, msg, 50)
      );
      updateProgress(3, 9, 'Content interleaving complete', 100);
      
      // Step 10: Compose Final Curriculum
      updateProgress(3, 10, 'Composing final curriculum', 0);
      const modules = writer.composeFinalCurriculum(
        interleavedClusters,
        theoryItems,
        questionItems,
        taskItems,
        msg => updateProgress(3, 10, msg, 50)
      );
      updateProgress(3, 10, 'Final curriculum composition complete', 100);
      
      // Save to Firestore if requested
      if (options.saveToFirestore) {
        updateProgress(3, 11, 'Saving curriculum to Firestore', 0);
        await writer.saveCurriculumToFirestore(
          modules,
          msg => updateProgress(3, 11, msg, 50)
        );
        updateProgress(3, 11, 'Curriculum saved to Firestore', 100);
      }
      
      const endTime = Date.now();
      const totalItems = theoryItems.length + questionItems.length + taskItems.length;
      
      return {
        modules,
        stats: {
          totalItems,
          totalModules: modules.length,
          processingTimeMs: endTime - startTime,
          aiProcessingTimeMs: aiStartTime && aiEndTime ? aiEndTime - aiStartTime : undefined
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      onProgress?.({
        phase: 0,
        step: 0,
        message: `Error generating curriculum: ${errorMessage}`,
        progress: 0,
        error: errorMessage
      });
      throw error;
    }
  }
}
