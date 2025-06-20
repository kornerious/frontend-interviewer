/**
 * ChunkManager
 * 
 * Splits database.json into manageable chunks for AI processing
 * based on token count estimation rather than file size
 */
import fs from 'fs';
import path from 'path';

// Fixed number of chunks to create - enforced maximum
const MAX_CHUNKS = 5;

// Token estimation factors
// A rough approximation: 1 token ≈ 4 characters in English text
const CHARS_PER_TOKEN = 4;

// Gemini output token limit
const OUTPUT_TOKEN_LIMIT = 60000;

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
    console.log(`ChunkManager: Token-based chunking: Target ~${MAX_CHUNKS} chunks, limit ~${OUTPUT_TOKEN_LIMIT} tokens per chunk`);
    
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
    
    // Read the entire file at once
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
    
    // Calculate total token count estimation for planning
    const totalJsonString = JSON.stringify(data);
    const totalCharCount = totalJsonString.length;
    const estimatedTotalTokens = Math.ceil(totalCharCount / CHARS_PER_TOKEN);
    
    console.log(`ChunkManager: Estimated total tokens: ${estimatedTotalTokens} (${totalCharCount} characters)`);
    
    // Calculate items per chunk to ensure exactly MAX_CHUNKS (or fewer if data is small)
    const itemsPerChunk = Math.ceil(data.length / MAX_CHUNKS);
    console.log(`ChunkManager: Total items: ${data.length}, dividing into exactly ${MAX_CHUNKS} chunks`);
    console.log(`ChunkManager: Target items per chunk: ${itemsPerChunk}`);
    
    // Create chunks
    const chunks: ChunkMetadata[] = [];
    let chunkIndex = 0;
    let startIndex = 0;
    
    console.log(`ChunkManager: Starting to process items...`);
    
    // Process in exactly MAX_CHUNKS chunks by dividing items evenly
    for (let chunkIndex = 0; chunkIndex < MAX_CHUNKS; chunkIndex++) {
      const startItemIndex = chunkIndex * itemsPerChunk;
      const endItemIndex = Math.min((chunkIndex + 1) * itemsPerChunk - 1, data.length - 1);
      
      if (startItemIndex > data.length - 1) {
        // We've already processed all items
        break;
      }
      
      const chunkItems = data.slice(startItemIndex, endItemIndex + 1);
      
      // Log chunk details
      console.log(`ChunkManager: Processing chunk #${chunkIndex}, items ${startItemIndex} to ${endItemIndex}`);
      
      // Estimate tokens for this chunk
      const chunkString = JSON.stringify(chunkItems);
      const chunkCharCount = chunkString.length;
      const estimatedChunkTokens = Math.ceil(chunkCharCount / CHARS_PER_TOKEN);
      
      // Save current chunk
      const chunkId = `${this.chunkPrefix}-${chunkIndex}`;
      const chunkPath = path.join(this.outputDir, `${chunkId}.json`);
      
      // Write chunk to file
      fs.writeFileSync(
        chunkPath,
        JSON.stringify(chunkItems, null, 2),
        'utf-8'
      );
      
      // Create chunk metadata
      const chunkMeta: ChunkMetadata = {
        chunkId,
        itemCount: chunkItems.length,
        startIndex: startItemIndex,
        endIndex: endItemIndex,
        filePath: chunkPath,
        sizeBytes: Buffer.byteLength(chunkString)
      };
      
      chunks.push(chunkMeta);
      console.log(`ChunkManager: Created chunk ${chunkId} with ${chunkItems.length} items (est. ${estimatedChunkTokens} tokens)`);
    }
    
    console.log(`ChunkManager: Finished processing all items`);
    
    // Create a summary file with chunk metadata
    const summaryPath = path.join(this.outputDir, 'chunks-summary.json');
    fs.writeFileSync(
      summaryPath,
      JSON.stringify({
        totalChunks: chunks.length,
        totalItems: data.length,
        estimatedTotalTokens,
        itemsPerChunk,
        chunks
      }, null, 2),
      'utf-8'
    );
    
    console.log(`ChunkManager: Completed chunking. Created ${chunks.length} chunks with ${data.length} total items.`);
    
    return chunks;
  }
}
