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
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Create a stream to read the database file
    const readStream = fs.createReadStream(this.databasePath, { 
      encoding: 'utf-8',
      highWaterMark: 1024 * 1024 // 1MB buffer
    });
    
    // Parse the JSON stream
    const jsonParser = JSONStream.parse('*');
    
    // Create chunks
    const chunks: ChunkMetadata[] = [];
    let currentChunk: any[] = [];
    let currentChunkSize = 0;
    let chunkIndex = 0;
    let itemIndex = 0;
    let startIndex = 0;
    
    // Process each item from the stream
    const itemProcessor = new Transform({
      objectMode: true,
      transform(item, encoding, callback) {
        // Add item to current chunk
        currentChunk.push(item);
        
        // Estimate size (rough approximation)
        const itemSize = JSON.stringify(item).length;
        currentChunkSize += itemSize;
        
        // If chunk is full, save it
        if (currentChunkSize >= MAX_CHUNK_SIZE || currentChunk.length >= 1000) {
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
            endIndex: itemIndex,
            filePath: chunkPath,
            sizeBytes: currentChunkSize
          };
          
          chunks.push(chunkMeta);
          console.log(`ChunkManager: Created chunk ${chunkId} with ${currentChunk.length} items (${(currentChunkSize / (1024 * 1024)).toFixed(2)} MB)`);
          
          // Reset for next chunk
          currentChunk = [];
          currentChunkSize = 0;
          chunkIndex++;
          startIndex = itemIndex + 1;
        }
        
        itemIndex++;
        callback(null, item);
      }
    });
    
    // Run the pipeline
    const pipelineAsync = promisify(pipeline);
    await pipelineAsync(readStream, jsonParser, itemProcessor);
    
    // Save any remaining items as the last chunk
    if (currentChunk.length > 0) {
      const chunkId = `${this.chunkPrefix}-${chunkIndex}`;
      const chunkPath = path.join(this.outputDir, `${chunkId}.json`);
      
      fs.writeFileSync(
        chunkPath,
        JSON.stringify(currentChunk, null, 2),
        'utf-8'
      );
      
      const chunkMeta: ChunkMetadata = {
        chunkId,
        itemCount: currentChunk.length,
        startIndex,
        endIndex: itemIndex - 1,
        filePath: chunkPath,
        sizeBytes: currentChunkSize
      };
      
      chunks.push(chunkMeta);
      console.log(`ChunkManager: Created final chunk ${chunkId} with ${currentChunk.length} items (${(currentChunkSize / (1024 * 1024)).toFixed(2)} MB)`);
    }
    
    // Create a summary file with chunk metadata
    const summaryPath = path.join(this.outputDir, 'chunks-summary.json');
    fs.writeFileSync(
      summaryPath,
      JSON.stringify({
        totalChunks: chunks.length,
        totalItems: itemIndex,
        chunks
      }, null, 2),
      'utf-8'
    );
    
    console.log(`ChunkManager: Completed chunking. Created ${chunks.length} chunks with ${itemIndex} total items.`);
    
    return chunks;
  }
}
