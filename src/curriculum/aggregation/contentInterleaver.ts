/**
 * ContentInterleaver Component for Curriculum Generation
 * 
 * Responsible for:
 * - Interleaving content for pedagogical flow
 * - After each theory item, insert its related questions and tasks
 * - This improves learning by immediately reinforcing concepts with practice
 */

import fs from 'fs';
import path from 'path';
import { AggregatedItem } from './aggregator';

// Extended interface for AggregatedItem with additional properties needed for interleaving
interface EnhancedItem extends AggregatedItem {
  type?: string;
  relatedQuestions?: number[];
  relatedTasks?: number[];
  isRelatedItem?: boolean; // Flag to mark items that are related to others
}

export class ContentInterleaver {
  private itemsPath: string;
  private metadataPath: string;
  private outputDir: string;

  constructor(config: {
    itemsPath: string; 
    metadataPath?: string;
    outputDir: string;
  }) {
    this.itemsPath = config.itemsPath;
    this.metadataPath = config.metadataPath || path.join(process.cwd(), 'metadata.json');
    this.outputDir = config.outputDir;
  }

  /**
   * Main method to interleave content
   */
  public async interleave(): Promise<EnhancedItem[]> {
    try {
      console.log('ContentInterleaver: Starting content interleaving process');
      
      // Step 1: Load ordered items
      const items = await this.loadItems();
      console.log(`ContentInterleaver: Loaded ${items.length} ordered items`);
      
      // Step 2: Load metadata for relationship information
      const enhancedItems = await this.enhanceItemsWithRelationships(items);
      console.log(`ContentInterleaver: Enhanced ${enhancedItems.length} items with relationship data`);
      
      // Step 3: Interleave theory with related questions and tasks
      const interleavedItems = this.createInterleavedSequence(enhancedItems);
      console.log(`ContentInterleaver: Created interleaved sequence with ${interleavedItems.length} items`);
      
      // Save the interleaved items
      await this.saveInterleavedItems(interleavedItems);
      
      return interleavedItems;
    } catch (error) {
      console.error('ContentInterleaver: Error during content interleaving:', error);
      throw error;
    }
  }
  
  /**
   * Load items from the specified path
   */
  private async loadItems(): Promise<AggregatedItem[]> {
    try {
      if (!fs.existsSync(this.itemsPath)) {
        console.error(`ContentInterleaver: Items file not found at ${this.itemsPath}`);
        return [];
      }
      
      const content = await fs.promises.readFile(this.itemsPath, 'utf-8');
      return JSON.parse(content) as AggregatedItem[];
    } catch (error) {
      console.error('ContentInterleaver: Error loading items:', error);
      throw error;
    }
  }
  
  /**
   * Enhance items with relationship information from metadata
   */
  private async enhanceItemsWithRelationships(items: AggregatedItem[]): Promise<EnhancedItem[]> {
    try {
      console.log(`ContentInterleaver: Loading metadata from ${this.metadataPath}`);
      
      // Create enhanced items with default values
      const enhancedItems: EnhancedItem[] = items.map(item => ({
        ...item,
        type: 'theory', // Default type
        relatedQuestions: [],
        relatedTasks: [],
        isRelatedItem: false
      }));
      
      // Return with default values if metadata file doesn't exist
      if (!fs.existsSync(this.metadataPath)) {
        console.warn(`ContentInterleaver: Metadata file not found at ${this.metadataPath}`);
        return enhancedItems;
      }
      
      // Read the metadata file
      const metadataContent = await fs.promises.readFile(this.metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);
      
      // Validate metadata structure
      if (!metadata || !metadata.items) {
        console.warn('ContentInterleaver: Invalid metadata structure');
        return enhancedItems;
      }
      
      // Build index to item map for quick lookups
      const indexToItem = new Map<number, EnhancedItem>();
      enhancedItems.forEach(item => {
        indexToItem.set(item.index, item);
      });
      
      // Build ID to index map
      const idToIndex = new Map<string, number>();
      enhancedItems.forEach(item => {
        if (item.id) {
          idToIndex.set(item.id, item.index);
        }
      });
      
      // Process each item to add relationship information
      Object.entries(metadata.items).forEach(([itemId, itemMetadata]: [string, any]) => {
        // Skip if this item doesn't have an index in our list
        if (!idToIndex.has(itemId)) return;
        
        const index = idToIndex.get(itemId)!;
        const item = indexToItem.get(index);
        if (!item) return;
        
        // Set type and relationships
        item.type = itemMetadata.type || 'theory';
        
        // Add related questions if any
        if (itemMetadata.relatedQuestions && Array.isArray(itemMetadata.relatedQuestions)) {
          item.relatedQuestions = itemMetadata.relatedQuestions
            .filter((qId: string) => idToIndex.has(qId))
            .map((qId: string) => idToIndex.get(qId)!);
        }
        
        // Add related tasks if any
        if (itemMetadata.relatedTasks && Array.isArray(itemMetadata.relatedTasks)) {
          item.relatedTasks = itemMetadata.relatedTasks
            .filter((tId: string) => idToIndex.has(tId))
            .map((tId: string) => idToIndex.get(tId)!);
        }
      });
      
      return enhancedItems;
    } catch (error) {
      console.error('ContentInterleaver: Error enhancing items with relationships:', error);
      // Return the original items with default enhancement
      return items.map(item => ({
        ...item,
        type: 'theory',
        relatedQuestions: [],
        relatedTasks: []
      }));
    }
  }
  
  /**
   * Create interleaved sequence by inserting related items after each theory item
   */
  private createInterleavedSequence(items: EnhancedItem[]): EnhancedItem[] {
    // Build index to item map for quick lookups
    const indexToItem = new Map<number, EnhancedItem>();
    items.forEach(item => {
      indexToItem.set(item.index, item);
    });
    
    // Track items we've already inserted to avoid duplicates
    const insertedIndexes = new Set<number>();
    
    // Create interleaved sequence
    const interleavedItems: EnhancedItem[] = [];
    
    // Process items in their current order
    for (const item of items) {
      // Skip if already inserted
      if (insertedIndexes.has(item.index)) continue;
      
      // Add the current item
      interleavedItems.push(item);
      insertedIndexes.add(item.index);
      
      // If this is a theory item, insert its related questions and tasks
      if (item.type === 'theory') {
        // Insert related questions first
        if (item.relatedQuestions && item.relatedQuestions.length > 0) {
          for (const questionIndex of item.relatedQuestions) {
            // Skip if already inserted
            if (insertedIndexes.has(questionIndex)) continue;
            
            const questionItem = indexToItem.get(questionIndex);
            if (questionItem) {
              interleavedItems.push({
                ...questionItem,
                isRelatedItem: true
              });
              insertedIndexes.add(questionIndex);
            }
          }
        }
        
        // Then insert related tasks
        if (item.relatedTasks && item.relatedTasks.length > 0) {
          for (const taskIndex of item.relatedTasks) {
            // Skip if already inserted
            if (insertedIndexes.has(taskIndex)) continue;
            
            const taskItem = indexToItem.get(taskIndex);
            if (taskItem) {
              interleavedItems.push({
                ...taskItem,
                isRelatedItem: true
              });
              insertedIndexes.add(taskIndex);
            }
          }
        }
      }
    }
    
    // Add any remaining items that weren't inserted
    for (const item of items) {
      if (!insertedIndexes.has(item.index)) {
        interleavedItems.push(item);
        insertedIndexes.add(item.index);
      }
    }
    
    return interleavedItems;
  }
  
  /**
   * Save the interleaved items to a JSON file
   */
  private async saveInterleavedItems(items: EnhancedItem[]): Promise<void> {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      const outputPath = path.join(this.outputDir, 'interleaved-items.json');
      await fs.promises.writeFile(
        outputPath,
        JSON.stringify(items, null, 2),
        'utf-8'
      );
      
      console.log(`ContentInterleaver: Saved ${items.length} interleaved items to ${outputPath}`);
    } catch (error) {
      console.error('ContentInterleaver: Error saving interleaved items:', error);
      throw error;
    }
  }
}
