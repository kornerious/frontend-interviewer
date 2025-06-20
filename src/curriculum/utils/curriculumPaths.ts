/**
 * Curriculum Paths Utility
 * 
 * This module provides consistent path handling for all curriculum-related files
 * It ensures all components use consistent file locations and avoids path inconsistencies
 */

import path from 'path';

export class CurriculumPaths {
  // Base paths
  static getRootDir(): string {
    return process.cwd();
  }
  
  static getCurriculumDir(): string {
    return path.join(this.getRootDir(), 'curriculum');
  }
  
  // Database paths
  static getDatabasePath(): string {
    return path.join(this.getCurriculumDir(), 'database.json');
  }
  
  // Metadata paths
  static getMetadataPath(): string {
    return path.join(this.getCurriculumDir(), 'metadata.json');
  }
  
  // Graph paths
  static getGraphsPath(): string {
    return path.join(this.getCurriculumDir(), 'graphs.json');
  }
  
  // Scores paths
  static getScoresPath(): string {
    return path.join(this.getCurriculumDir(), 'scores.json');
  }
  
  // Chunks paths
  static getChunksDir(): string {
    return path.join(this.getCurriculumDir(), 'chunks');
  }
  
  static getChunksProcessedPath(): string {
    return path.join(this.getCurriculumDir(), 'chunks-processed.json');
  }
  
  static getChunkPath(chunkId: string): string {
    return path.join(this.getChunksDir(), `${chunkId}.json`);
  }
  
  // Aggregation paths
  static getAggregatedItemsPath(): string {
    return path.join(this.getCurriculumDir(), 'aggregated-items.json');
  }
  
  static getRefinedItemsPath(): string {
    return path.join(this.getCurriculumDir(), 'refined-items.json');
  }
  
  static getOrderedItemsPath(): string {
    return path.join(this.getCurriculumDir(), 'ordered-items.json');
  }
  
  static getInterleavedItemsPath(): string {
    return path.join(this.getCurriculumDir(), 'interleaved-items.json');
  }
  
  // Final curriculum path
  static getCurriculumPath(): string {
    return path.join(this.getCurriculumDir(), 'curriculum.json');
  }
  
  // Utility method to ensure directories exist
  static ensureDirExists(dirPath: string): void {
    const fs = require('fs');
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  // Utility method to ensure curriculum structure exists
  static ensureCurriculumStructure(): void {
    const fs = require('fs');
    
    // Ensure main curriculum directory exists
    this.ensureDirExists(this.getCurriculumDir());
    
    // Ensure chunks directory exists
    this.ensureDirExists(this.getChunksDir());
  }
}
