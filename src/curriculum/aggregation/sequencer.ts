/**
 * Sequencer Component for Curriculum Generation
 * 
 * Responsible for:
 * - Optional final AI pass to refine the overall sequence
 * - Uses Gemini AI to improve the final curriculum flow
 */

import path from 'path';
import fs from 'fs';
import { AggregatedItem } from './aggregator';
import { callGeminiAPI } from '@/services/aiService';

export class Sequencer {
  private aggregatedItemsPath: string;
  private outputDir: string;

  constructor(config: {
    aggregatedItemsPath: string;
    outputDir: string;
  }) {
    this.aggregatedItemsPath = config.aggregatedItemsPath;
    this.outputDir = config.outputDir;
  }

  /**
   * Refine the curriculum sequence using AI
   */
  public async refine(): Promise<AggregatedItem[]> {
    try {
      console.log('Sequencer: Starting AI refinement of curriculum sequence');
      
      // Load the aggregated items
      const aggregatedItems = await this.loadAggregatedItems();
      console.log(`Sequencer: Loaded ${aggregatedItems.length} aggregated items`);
      
      // If there are no items or very few items, return as-is
      if (aggregatedItems.length <= 5) {
        console.log('Sequencer: Not enough items to refine, returning original sequence');
        return aggregatedItems;
      }
      
      // Send to AI for refinement
      const refinedItems = await this.refineWithAI(aggregatedItems);
      console.log(`Sequencer: Refined sequence now has ${refinedItems.length} items`);
      
      // Save the refined sequence
      await this.saveRefinedItems(refinedItems);
      
      return refinedItems;
    } catch (error) {
      console.error('Sequencer: Error during sequence refinement:', error);
      // In case of error, return the original aggregated items if possible
      try {
        return await this.loadAggregatedItems();
      } catch {
        console.error('Sequencer: Could not fall back to original items');
        throw error;
      }
    }
  }
  
  /**
   * Load the aggregated items
   */
  private async loadAggregatedItems(): Promise<AggregatedItem[]> {
    try {
      if (!fs.existsSync(this.aggregatedItemsPath)) {
        console.error(`Sequencer: Aggregated items file not found at ${this.aggregatedItemsPath}`);
        return [];
      }
      
      const content = await fs.promises.readFile(this.aggregatedItemsPath, 'utf-8');
      return JSON.parse(content) as AggregatedItem[];
    } catch (error) {
      console.error('Sequencer: Error loading aggregated items:', error);
      throw error;
    }
  }
  
  /**
   * Send the current sequence to AI for refinement
   */
  private async refineWithAI(items: AggregatedItem[]): Promise<AggregatedItem[]> {
    try {
      // Construct the prompt for AI
      const prompt = this.constructPrompt(items);
      
      // Call the AI service
      console.log('Sequencer: Calling AI to refine curriculum sequence');
      const response = await callGeminiAPI(prompt);
      
      // Parse the AI response
      return this.parseAIResponse(response, items);
    } catch (error) {
      console.error('Sequencer: Error refining with AI:', error);
      // Return original items on error
      return items;
    }
  }
  
  /**
   * Construct the prompt for AI refinement
   */
  private constructPrompt(items: AggregatedItem[]): string {
    return `
You are a curriculum design expert. You are refining a carefully sequenced curriculum for frontend interview preparation.

The current sequence contains ${items.length} items of various types and complexities.

Current sequence (showing index values only):
${JSON.stringify(items.map(item => item.index))}

Your task is to refine this sequence to create a smoother learning progression from beginner to expert level.

Please follow these guidelines:
1. Maintain the overall structure and groupings when possible
2. Ensure topics flow logically from foundational to advanced concepts
3. Keep related concepts together when it makes educational sense
4. Focus on creating the optimal learning path for someone preparing for frontend interviews

Return ONLY a JSON array of index numbers in the newly refined order. Example:
[0, 1, 4, 2, 3, 5, 6, 7]
`;
  }
  
  /**
   * Parse the AI response and convert it back to AggregatedItem array
   */
  private parseAIResponse(response: string, originalItems: AggregatedItem[]): AggregatedItem[] {
    try {
      // Try to extract a JSON array from the response
      let jsonMatch = response.match(/\[[\d,\s]+\]/);
      
      if (!jsonMatch) {
        console.warn('Sequencer: Could not extract JSON array from AI response');
        return originalItems;
      }
      
      // Parse the JSON array
      const newIndexOrder = JSON.parse(jsonMatch[0]) as number[];
      
      // Validate that all indices are present and no new ones were added
      const originalIndices = new Set(originalItems.map(item => item.index));
      const allIndicesPresent = newIndexOrder.every(idx => originalIndices.has(idx));
      const noNewIndices = newIndexOrder.length === originalItems.length;
      
      if (!allIndicesPresent || !noNewIndices) {
        console.warn('Sequencer: AI response contained invalid or missing indices');
        return originalItems;
      }
      
      // Map the indices back to their original items
      const indexToItem = new Map<number, AggregatedItem>();
      originalItems.forEach(item => {
        indexToItem.set(item.index, item);
      });
      
      // Create the refined sequence
      const refinedItems: AggregatedItem[] = newIndexOrder.map(idx => indexToItem.get(idx)!);
      
      return refinedItems;
    } catch (error) {
      console.error('Sequencer: Error parsing AI response:', error);
      return originalItems;
    }
  }
  
  /**
   * Save the refined items to a JSON file
   */
  private async saveRefinedItems(items: AggregatedItem[]): Promise<void> {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      const outputPath = path.join(this.outputDir, 'refined-items.json');
      await fs.promises.writeFile(
        outputPath,
        JSON.stringify(items, null, 2),
        'utf-8'
      );
      
      console.log(`Sequencer: Saved ${items.length} refined items to ${outputPath}`);
    } catch (error) {
      console.error('Sequencer: Error saving refined items:', error);
      throw error;
    }
  }
}
