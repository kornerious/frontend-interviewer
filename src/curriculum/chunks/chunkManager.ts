/**
 * ChunkManager
 * 
 * Streams and splits database.json into manageable chunks for AI processing
 */
import fs from 'fs';
import path from 'path';
import { Transform, pipeline } from 'stream';
import { promisify } from 'util';
import JSONStream from 'jsonstream-next';

// Maximum size of each chunk in bytes (approximately 50MB)
const MAX_CHUNK_SIZE = 50 * 1024 * 1024;

/**
 * Interface for chunk metadata
 */
export interface ChunkMetadata {
  chunkId: string;
  itemCount: number;
  startIndex: number;
  endIndex: number;
  filePath: string;
  sizeBytes: number;
}

/**
 * ChunkManager class
 * 
 * Responsible for streaming and chunking the database.json file
 */
export class ChunkManager {
  private databasePath: string;
  private outputDir: string;
  private chunkPrefix: string;
  
  /**
   * Constructor
   * @param databasePath Path to database.json
   * @param outputDir Directory to save chunks
   * @param chunkPrefix Prefix for chunk files
   */
  constructor(
    databasePath: string,
    outputDir: string,
    chunkPrefix: string = 'chunk'
  ) {
    this.databasePath = databasePath;
    this.outputDir = outputDir;
    this.chunkPrefix = chunkPrefix;
  }
  
  /**
   * Create chunks from database.json
   * @returns Promise with array of chunk metadata
   */
  public async createChunks(): Promise<ChunkMetadata[]> {
    console.log(`ChunkManager: Starting to chunk database from ${this.databasePath}`);
    console.log(`ChunkManager: Output directory: ${this.outputDir}`);
    console.log(`ChunkManager: Chunk prefix: ${this.chunkPrefix}`);
    
    // Check if database file exists
    if (!fs.existsSync(this.databasePath)) {
      console.error(`ChunkManager: ERROR - Database file not found at ${this.databasePath}`);
      throw new Error(`Database file not found at ${this.databasePath}`);
    }
    
    console.log(`ChunkManager: Database file exists, size: ${(fs.statSync(this.databasePath).size / (1024 * 1024)).toFixed(2)} MB`);
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      console.log(`ChunkManager: Creating output directory: ${this.outputDir}`);
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Read the entire file at once instead of streaming
    console.log(`ChunkManager: Reading database file...`);
    const fileContent = fs.readFileSync(this.databasePath, 'utf-8');
    console.log(`ChunkManager: Parsing JSON...`);
    
    let data: any[];
    try {
      data = JSON.parse(fileContent);
      console.log(`ChunkManager: Successfully parsed JSON, found ${data.length} items`);
    } catch (error) {
      console.error(`ChunkManager: ERROR parsing JSON:`, error);
      throw error;
    }
    
    // Create chunks
    const chunks: ChunkMetadata[] = [];
    let currentChunk: any[] = [];
    let currentChunkSize = 0;
    let chunkIndex = 0;
    let startIndex = 0;
    
    console.log(`ChunkManager: Starting to process items...`);
    
    // Process each item
    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      
      // Log first few items and then every 100th item
      if (i < 5 || i % 100 === 0) {
        console.log(`ChunkManager: Processing item #${i}, id: ${item.id || 'unknown'}`);
      }
      
      // Add item to current chunk
      currentChunk.push(item);
      
      // Estimate size (rough approximation)
      const itemSize = JSON.stringify(item).length;
      currentChunkSize += itemSize;
      
      // If chunk is full, save it
      if (currentChunkSize >= MAX_CHUNK_SIZE || currentChunk.length >= 1000 || i === data.length - 1) {
        const chunkId = `${this.chunkPrefix}-${chunkIndex}`;
        const chunkPath = path.join(this.outputDir, `${chunkId}.json`);
        
        // Write chunk to file
        fs.writeFileSync(
          chunkPath,
          JSON.stringify(currentChunk, null, 2),
          'utf-8'
        );
        
        // Create chunk metadata
        const chunkMeta: ChunkMetadata = {
          chunkId,
          itemCount: currentChunk.length,
          startIndex,
          endIndex: i,
          filePath: chunkPath,
          sizeBytes: currentChunkSize
        };
        
        chunks.push(chunkMeta);
        console.log(`ChunkManager: Created chunk ${chunkId} with ${currentChunk.length} items (${(currentChunkSize / (1024 * 1024)).toFixed(2)} MB)`);
        
        // Reset for next chunk
        currentChunk = [];
        currentChunkSize = 0;
        chunkIndex++;
        startIndex = i + 1;
      }
    }
    
    console.log(`ChunkManager: Finished processing all items`);
    
    // We don't need this anymore since we handle the last chunk in the loop
    
    // Create a summary file with chunk metadata
    const summaryPath = path.join(this.outputDir, 'chunks-summary.json');
    fs.writeFileSync(
      summaryPath,
      JSON.stringify({
        totalChunks: chunks.length,
        totalItems: data.length,
        chunks
      }, null, 2),
      'utf-8'
    );
    
    console.log(`ChunkManager: Completed chunking. Created ${chunks.length} chunks with ${data.length} total items.`);
    
    return chunks;
  }
}
