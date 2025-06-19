import { TheoryItem, QuestionItem, TaskItem } from '@/types';
import { MetadataItem } from './metadataExtractor';

export interface ChunkData {
  id: string;
  items: MetadataItem[];
  startIndex: number;
  endIndex: number;
}

/**
 * Phase 2: AI-Assisted Clustering & Sequencing
 * Step 4: Stream and Chunk the Database
 */
export class ChunkManager {
  private readonly chunkSizeBytes: number;
  private readonly maxItemsPerChunk: number;
  
  constructor(
    chunkSizeBytes = 50 * 1024 * 1024, // ~50MB chunks
    maxItemsPerChunk = 1000 // Max items per chunk
  ) {
    this.chunkSizeBytes = chunkSizeBytes;
    this.maxItemsPerChunk = maxItemsPerChunk;
  }
  
  /**
   * Creates chunks from metadata items
   */
  createChunks(
    metadata: MetadataItem[],
    theoryItems: TheoryItem[],
    questionItems: QuestionItem[],
    taskItems: TaskItem[]
  ): ChunkData[] {
    console.log('Phase 2, Step 4: Creating chunks from database items');
    
    const chunks: ChunkData[] = [];
    let currentChunk: MetadataItem[] = [];
    let currentChunkSize = 0;
    let startIndex = 0;
    let chunkId = 1;
    
    // Helper to estimate item size in bytes
    const estimateItemSize = (item: MetadataItem): number => {
      // Find the original item to estimate its size
      let originalItem: any;
      
      if (item.type === 'theory') {
        originalItem = theoryItems.find(i => i.id === item.id);
      } else if (item.type === 'question') {
        originalItem = questionItems.find(i => i.id === item.id);
      } else {
        originalItem = taskItems.find(i => i.id === item.id);
      }
      
      if (!originalItem) {
        return 1000; // Default size if not found
      }
      
      // Rough estimate based on JSON.stringify
      return JSON.stringify(originalItem).length;
    };
    
    // Process each metadata item
    for (let i = 0; i < metadata.length; i++) {
      const item = metadata[i];
      const itemSize = estimateItemSize(item);
      
      // Check if adding this item would exceed chunk size or max items
      if (
        (currentChunkSize + itemSize > this.chunkSizeBytes || 
         currentChunk.length >= this.maxItemsPerChunk) && 
        currentChunk.length > 0
      ) {
        // Save current chunk
        chunks.push({
          id: `chunk-${chunkId}`,
          items: currentChunk,
          startIndex,
          endIndex: i - 1
        });
        
        // Start new chunk
        currentChunk = [];
        currentChunkSize = 0;
        startIndex = i;
        chunkId++;
      }
      
      // Add item to current chunk
      currentChunk.push(item);
      currentChunkSize += itemSize;
    }
    
    // Add the last chunk if not empty
    if (currentChunk.length > 0) {
      chunks.push({
        id: `chunk-${chunkId}`,
        items: currentChunk,
        startIndex,
        endIndex: metadata.length - 1
      });
    }
    
    console.log(`Created ${chunks.length} chunks from ${metadata.length} items`);
    return chunks;
  }
}
