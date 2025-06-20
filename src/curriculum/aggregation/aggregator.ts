/**
 * Aggregator Component for Curriculum Generation
 * 
 * Responsible for:
 * 1. Merging chunks from AI processing
 * 2. Deduplicating items while preserving order
 * 3. Resolving cross-chunk dependencies
 */

import fs from 'fs';
import path from 'path';

// Define types for our data structures
export interface AggregatedItem {
  index: number;
  id?: string;
  moduleId?: string;
  complexity?: number;
  contentIndex?: number;
  tags?: string[];
}

export interface DependencyGraph {
  nodes: Record<string, {
    id: string;
    prerequisites: string[];
    complexity?: number;
  }>;
}

export class Aggregator {
  private chunksDir: string;
  private graphsPath: string;
  private outputDir: string;
  private maxChunks: number;
  private chunksProcessedPath: string;

  constructor(config: {
    chunksDir: string;
    chunksProcessedPath?: string;
    graphsPath?: string;
    outputDir: string;
    maxChunks?: number;
  }) {
    this.chunksDir = config.chunksDir;
    this.chunksProcessedPath = config.chunksProcessedPath || path.join(process.cwd(), 'curriculum', 'chunks-processed.json');
    this.graphsPath = config.graphsPath || path.join(process.cwd(), 'graphs.json');
    this.outputDir = config.outputDir;
    this.maxChunks = config.maxChunks || 10; // Default to 10 chunks max
  }

  /**
   * Main method to merge chunks, deduplicate, and resolve dependencies
   */
  public async aggregate(): Promise<AggregatedItem[]> {
    try {
      console.log('Aggregator: Starting aggregation process');

      // Step 1: Load and merge chunks
      const mergedItems = await this.mergeChunks();
      console.log(`Aggregator: Merged ${mergedItems.length} items from chunks`);

      // Step 2: Deduplicate items
      const deduplicatedItems = this.deduplicateItems(mergedItems);
      console.log(`Aggregator: Deduplicated to ${deduplicatedItems.length} items`);

      // Step 3: Load dependency graph
      const dependencyGraph = await this.loadDependencyGraph();
      console.log(`Aggregator: Loaded dependency graph with ${Object.keys(dependencyGraph.nodes).length} nodes`);

      // Step 4: Resolve cross-chunk dependencies
      const resolvedItems = this.resolveDependencies(deduplicatedItems, dependencyGraph);
      console.log(`Aggregator: Resolved dependencies, final count: ${resolvedItems.length} items`);

      // Save the aggregated items
      await this.saveAggregatedItems(resolvedItems);

      return resolvedItems;
    } catch (error) {
      console.error('Aggregator: Error during aggregation:', error);
      throw error;
    }
  }

  /**
   * Step 1: Merge chunks from AI processing
   */
  private async mergeChunks(): Promise<AggregatedItem[]> {
    try {
      // Handle both possible locations for chunks-processed.json
      let chunksProcessed;
      let chunksProcessedContent = '';
      
      // First try the expected location
      if (fs.existsSync(this.chunksProcessedPath)) {
        chunksProcessedContent = await fs.promises.readFile(this.chunksProcessedPath, 'utf-8');
      } else {
        // Fall back to checking the root directory
        const rootChunksProcessedPath = path.join(process.cwd(), 'chunks-processed.json');
        if (fs.existsSync(rootChunksProcessedPath)) {
          console.log(`Aggregator: Using chunks-processed.json from root directory`);
          chunksProcessedContent = await fs.promises.readFile(rootChunksProcessedPath, 'utf-8');
        } else {
          console.error(`Aggregator: chunks-processed.json not found at ${this.chunksProcessedPath} or root directory`);
          return [];
        }
      }
      
      try {
        chunksProcessed = JSON.parse(chunksProcessedContent);
      } catch (parseError) {
        console.error('Aggregator: Failed to parse chunks-processed.json:', parseError);
        return [];
      }
      
      // Validate the structure
      if (!chunksProcessed || !chunksProcessed.chunks || !Array.isArray(chunksProcessed.chunks)) {
        console.error('Aggregator: Invalid chunks-processed.json structure');
        return [];
      }
      
      console.log(`Aggregator: Found ${chunksProcessed.chunks.length} processed chunks`);

      // Process each chunk up to maxChunks
      const chunkResults: AggregatedItem[][] = [];
      const numChunksToProcess = Math.min(chunksProcessed.chunks.length, this.maxChunks);

      for (let i = 0; i < numChunksToProcess; i++) {
        const chunkInfo = chunksProcessed.chunks[i];
        const chunkId = chunkInfo.chunkId;
        
        // Try multiple possible locations for chunk files
        const possibleChunkPaths = [
          path.join(this.chunksDir, `${chunkId}.json`),
          path.join(process.cwd(), 'curriculum', 'chunks', `${chunkId}.json`),
          path.join(process.cwd(), 'curriculum', 'results', `${chunkId}.json`)
        ];
        
        let chunkPath = '';
        for (const possiblePath of possibleChunkPaths) {
          if (fs.existsSync(possiblePath)) {
            chunkPath = possiblePath;
            break;
          }
        }
        
        if (!chunkPath) {
          console.warn(`Aggregator: Chunk file not found for ${chunkId} in any expected location`);
          continue;
        }
        
        console.log(`Aggregator: Processing chunk ${chunkId} from ${chunkPath}`);

        try {
          const chunkContent = await fs.promises.readFile(chunkPath, 'utf-8');
          const chunkData = JSON.parse(chunkContent);
          
          // Handle both formats: {items: [...]} or direct array [...]
          if (chunkData && chunkData.items && Array.isArray(chunkData.items)) {
            // Format: {items: [...]} 
            chunkResults.push(chunkData.items);
          } else if (Array.isArray(chunkData)) {
            // Format: Direct array [...]
            // Transform each item to ensure it has the expected structure
            const processedItems: AggregatedItem[] = [];
            
            chunkData.forEach((item, idx) => {
              // Extract key properties from the content
              if (item && item.content && item.content.theory) {
                const theoryItem = item.content.theory[0] || {};
                processedItems.push({
                  id: theoryItem.id,
                  index: item.index || chunkResults.length * 1000 + idx,
                  moduleId: theoryItem.technology?.toLowerCase() || 'default',
                  complexity: theoryItem.complexity || 5,
                  tags: theoryItem.tags || []
                });
              }
            });
            
            if (processedItems.length > 0) {
              chunkResults.push(processedItems);
              console.log(`Aggregator: Processed ${processedItems.length} items from direct array format`);
            } else {
              console.warn(`Aggregator: Could not extract valid items from array in ${chunkPath}`);
            }
          } else {
            console.warn(`Aggregator: Invalid chunk format in ${chunkPath}`);
          }
        } catch (chunkError) {
          console.error(`Aggregator: Error processing chunk ${chunkId}:`, chunkError);
        }
      }

      // Flatten all chunks into a single array
      const allItems: AggregatedItem[] = [];
      chunkResults.forEach(chunk => {
        if (Array.isArray(chunk)) {
          allItems.push(...chunk);
        }
      });

      console.log(`Aggregator: Successfully merged ${allItems.length} items from ${chunkResults.length} chunks`);
      return allItems;
    } catch (error) {
      console.error('Aggregator: Error merging chunks:', error);
      return [];
    }
  }

  /**
   * Step 2: Deduplicate items while preserving order
   */
  private deduplicateItems(items: AggregatedItem[]): AggregatedItem[] {
    const seen = new Set<string>();
    const deduplicatedItems: AggregatedItem[] = [];

    for (const item of items) {
      // Skip items without an ID
      if (!item.id) {
        deduplicatedItems.push(item);
        continue;
      }
      
      // Add only if not seen before
      if (!seen.has(item.id)) {
        seen.add(item.id);
        deduplicatedItems.push(item);
      }
    }

    return deduplicatedItems;
  }

  /**
   * Load dependency graph from JSON
   */
  private async loadDependencyGraph(): Promise<DependencyGraph> {
    try {
      if (!fs.existsSync(this.graphsPath)) {
        console.warn(`Aggregator: Dependency graph file not found: ${this.graphsPath}`);
        return { nodes: {} };
      }

      const graphsContent = await fs.promises.readFile(this.graphsPath, 'utf-8');
      let graphs;
      try {
        graphs = JSON.parse(graphsContent);
      } catch (parseError) {
        console.error('Aggregator: Error parsing dependency graph JSON:', parseError);
        return { nodes: {} };
      }

      // Handle multiple possible graph structures
      let dependencyGraph: DependencyGraph = { nodes: {} };
      
      // Case 1: Standard structure with graphs.dependency.nodes
      if (graphs && graphs.dependency && graphs.dependency.nodes) {
        dependencyGraph = graphs.dependency as DependencyGraph;
        console.log(`Aggregator: Loaded dependency graph with ${Object.keys(dependencyGraph.nodes).length} nodes`);
        return dependencyGraph;
      }
      
      // Case 2: Direct nodes object at the root
      if (graphs && typeof graphs === 'object' && !Array.isArray(graphs)) {
        if (graphs.nodes && typeof graphs.nodes === 'object') {
          dependencyGraph = graphs as DependencyGraph;
          console.log(`Aggregator: Loaded dependency graph directly with ${Object.keys(dependencyGraph.nodes).length} nodes`);
          return dependencyGraph;
        }
        
        // Case 3: Dependencies at the root level
        // Create a nodes object from direct item-to-dependencies mapping
        const nodes: Record<string, { id: string; prerequisites: string[]; complexity?: number }> = {};
        let foundDependencies = false;
        
        Object.entries(graphs).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            // Transform simple array to expected structure
            nodes[key] = {
              id: key,
              prerequisites: value as string[],
              complexity: 1 // default complexity
            };
            foundDependencies = true;
          }
        });
        
        if (foundDependencies) {
          console.log(`Aggregator: Created dependency graph from direct mappings with ${Object.keys(nodes).length} nodes`);
          return { nodes };
        }
      }
      
      // If we reach here, no valid structure was found
      console.warn('Aggregator: Could not determine dependency graph structure, using empty graph');
      return { nodes: {} };
    } catch (error) {
      console.error('Aggregator: Error loading dependency graph:', error);
      return { nodes: {} };
    }
  }

  /**
   * Step 3: Resolve cross-chunk dependencies
   */
  private resolveDependencies(
    items: AggregatedItem[],
    dependencyGraph: DependencyGraph
  ): AggregatedItem[] {
    // Create a map of item indices to their positions in the array
    const indexToPosition = new Map<number, number>();
    items.forEach((item, position) => {
      indexToPosition.set(item.index, position);
    });

    // Create a map of item IDs to their indices
    const idToIndex = new Map<string, number>();
    items.forEach(item => {
      if (item.id) {
        idToIndex.set(item.id, item.index);
      }
    });

    // Create a copy of the items array to modify
    const result = [...items];
    let modified = true;
    let iterations = 0;
    const maxIterations = 100; // Prevent infinite loops

    while (modified && iterations < maxIterations) {
      modified = false;
      iterations++;

      for (let i = 0; i < result.length; i++) {
        const item = result[i];
        
        // Skip if the item has no ID or is not in the dependency graph
        if (!item.id || !dependencyGraph.nodes[item.id]) {
          continue;
        }

        const prerequisites = dependencyGraph.nodes[item.id].prerequisites || [];
        
        for (const prereqId of prerequisites) {
          // Skip if the prerequisite is not in our idToIndex map
          if (!idToIndex.has(prereqId)) {
            continue;
          }

          const prereqIndex = idToIndex.get(prereqId)!;
          const prereqPosition = indexToPosition.get(prereqIndex);
          
          // Skip if the prerequisite is not in our items list
          if (prereqPosition === undefined) {
            continue;
          }

          // If the prerequisite comes after this item, move this item after the prerequisite
          if (prereqPosition > i) {
            // Remove the item
            const [movedItem] = result.splice(i, 1);
            
            // Insert it after its prerequisite
            result.splice(prereqPosition, 0, movedItem);
            
            // Update the position map
            for (let j = i; j <= prereqPosition; j++) {
              indexToPosition.set(result[j].index, j);
            }
            
            modified = true;
            break;
          }
        }

        if (modified) {
          break;
        }
      }
    }

    if (iterations >= maxIterations) {
      console.warn('Aggregator: Max iterations reached while resolving dependencies. There might be circular dependencies.');
    }

    return result;
  }

  /**
   * Save the aggregated items to a JSON file
   */
  private async saveAggregatedItems(items: AggregatedItem[]): Promise<void> {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      const outputPath = path.join(this.outputDir, 'aggregated-items.json');
      await fs.promises.writeFile(
        outputPath,
        JSON.stringify(items, null, 2),
        'utf-8'
      );
      
      console.log(`Aggregator: Saved ${items.length} aggregated items to ${outputPath}`);
    } catch (error) {
      console.error('Aggregator: Error saving aggregated items:', error);
      throw error;
    }
  }
}
