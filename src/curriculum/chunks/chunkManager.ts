/**
 * ChunkManager
 * 
 * Splits database.json into manageable chunks for AI processing
 * based on token count estimation rather than file size
 */
import fs from 'fs';
import path from 'path';

// Target number of chunks to create
const TARGET_CHUNKS = 5;

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
    console.log(`ChunkManager: Token-based chunking: Target ~${TARGET_CHUNKS} chunks, limit ~${OUTPUT_TOKEN_LIMIT} tokens per chunk`);
    
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
    
    // Calculate tokens per chunk, allowing for some overhead
    // Target is slightly fewer than output limit to allow for prompt + completion
    const tokenSafetyMargin = 0.8; // Use 80% of the limit to be safe
    const tokensPerChunk = Math.min(
      Math.ceil(estimatedTotalTokens / TARGET_CHUNKS),
      Math.floor(OUTPUT_TOKEN_LIMIT * tokenSafetyMargin)
    );
    
    console.log(`ChunkManager: Target tokens per chunk: ${tokensPerChunk}`);
    
    // Create chunks
    const chunks: ChunkMetadata[] = [];
    let currentChunk: any[] = [];
    let currentTokenCount = 0;
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
      
      // Estimate tokens for this item
      const itemString = JSON.stringify(item);
      const itemCharCount = itemString.length;
      const estimatedItemTokens = Math.ceil(itemCharCount / CHARS_PER_TOKEN);
      
      // If adding this item would exceed the token limit and we already have items,
      // save the current chunk before adding this item
      if (currentTokenCount > 0 && 
          (currentTokenCount + estimatedItemTokens > tokensPerChunk || i === data.length - 1)) {
        
        // Save current chunk
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
          endIndex: i - 1, // We haven't added item i yet
          filePath: chunkPath,
          sizeBytes: Buffer.byteLength(JSON.stringify(currentChunk))
        };
        
        chunks.push(chunkMeta);
        console.log(`ChunkManager: Created chunk ${chunkId} with ${currentChunk.length} items (est. ${currentTokenCount} tokens)`);
        
        // Reset for next chunk
        currentChunk = [];
        currentTokenCount = 0;
        chunkIndex++;
        startIndex = i;
      }
      
      // Add item to current chunk
      currentChunk.push(item);
      currentTokenCount += estimatedItemTokens;
      
      // Handle the last item if we haven't written yet
      if (i === data.length - 1 && currentChunk.length > 0) {
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
          sizeBytes: Buffer.byteLength(JSON.stringify(currentChunk))
        };
        
        chunks.push(chunkMeta);
        console.log(`ChunkManager: Created final chunk ${chunkId} with ${currentChunk.length} items (est. ${currentTokenCount} tokens)`);
      }
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
        tokensPerChunk,
        chunks
      }, null, 2),
      'utf-8'
    );
    
    console.log(`ChunkManager: Completed chunking. Created ${chunks.length} chunks with ${data.length} total items.`);
    
    return chunks;
  }
}
