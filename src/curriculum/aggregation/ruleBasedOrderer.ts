/**
 * RuleBasedOrderer Component for Curriculum Generation
 * 
 * Responsible for:
 * - Final rule-based ordering within modules
 * - Applying topological sort based on dependencies
 * - Breaking ties using complexity, relevance, and tag density
 */

import fs from 'fs';
import path from 'path';
import { AggregatedItem } from './aggregator';

interface MetadataItem {
  id: string;
  complexity?: number;
  interviewRelevance?: number;
  interviewFrequency?: number;
  tags?: string[];
  prerequisites?: string[];
}

interface ModuleGroup {
  moduleId: string;
  items: AggregatedItem[];
}

export class RuleBasedOrderer {
  private itemsPath: string;
  private metadataPath: string;
  private graphsPath: string;
  private outputDir: string;

  constructor(config: {
    itemsPath: string;
    metadataPath?: string;
    graphsPath?: string;
    outputDir: string;
  }) {
    this.itemsPath = config.itemsPath;
    this.metadataPath = config.metadataPath || path.join(process.cwd(), 'metadata.json');
    this.graphsPath = config.graphsPath || path.join(process.cwd(), 'graphs.json');
    this.outputDir = config.outputDir;
  }

  /**
   * Main method to apply rule-based ordering
   */
  public async order(): Promise<AggregatedItem[]> {
    try {
      console.log('RuleBasedOrderer: Starting rule-based ordering process');
      
      // Step 1: Load items
      const items = await this.loadItems();
      console.log(`RuleBasedOrderer: Loaded ${items.length} items`);
      
      // Step 2: Group items by module
      const moduleGroups = this.groupItemsByModule(items);
      console.log(`RuleBasedOrderer: Grouped items into ${moduleGroups.length} modules`);
      
      // Step 3: Load metadata for additional item properties
      const itemsWithMetadata = await this.enhanceItemsWithMetadata(items);
      
      // Step 4: Load dependency graph
      const dependencyGraph = await this.loadDependencyGraph();
      
      // Step 5: Order each module
      const orderedModules = await this.orderModules(moduleGroups, itemsWithMetadata, dependencyGraph);
      console.log('RuleBasedOrderer: Completed ordering of all modules');
      
      // Step 6: Flatten modules back to a single array
      const orderedItems = this.flattenModules(orderedModules);
      console.log(`RuleBasedOrderer: Final ordered curriculum has ${orderedItems.length} items`);
      
      // Save the ordered items
      await this.saveOrderedItems(orderedItems);
      
      return orderedItems;
    } catch (error) {
      console.error('RuleBasedOrderer: Error during rule-based ordering:', error);
      throw error;
    }
  }
  
  /**
   * Load items from the specified path
   */
  private async loadItems(): Promise<AggregatedItem[]> {
    try {
      if (!fs.existsSync(this.itemsPath)) {
        console.error(`RuleBasedOrderer: Items file not found at ${this.itemsPath}`);
        return [];
      }
      
      const content = await fs.promises.readFile(this.itemsPath, 'utf-8');
      return JSON.parse(content) as AggregatedItem[];
    } catch (error) {
      console.error('RuleBasedOrderer: Error loading items:', error);
      throw error;
    }
  }
  
  /**
   * Group items by their moduleId
   */
  private groupItemsByModule(items: AggregatedItem[]): ModuleGroup[] {
    const moduleMap = new Map<string, AggregatedItem[]>();
    
    // Group items by moduleId
    for (const item of items) {
      const moduleId = item.moduleId || 'default';
      if (!moduleMap.has(moduleId)) {
        moduleMap.set(moduleId, []);
      }
      moduleMap.get(moduleId)!.push(item);
    }
    
    // Convert map to array of ModuleGroup objects
    return Array.from(moduleMap.entries()).map(([moduleId, items]) => ({
      moduleId,
      items
    }));
  }
  
  /**
   * Enhance items with metadata from metadata.json
   */
  private async enhanceItemsWithMetadata(items: AggregatedItem[]): Promise<Map<number, MetadataItem>> {
    try {
      console.log(`RuleBasedOrderer: Loading metadata from ${this.metadataPath}`);
      
      // Create a default empty result
      const enhancedItems = new Map<number, MetadataItem>();
      
      // Return empty map if metadata file doesn't exist
      if (!fs.existsSync(this.metadataPath)) {
        console.warn(`RuleBasedOrderer: Metadata file not found at ${this.metadataPath}`);
        // Create default metadata for each item
        items.forEach(item => {
          enhancedItems.set(item.index, {
            id: item.id || `generated-${item.index}`,
            complexity: item.complexity || 1,
            interviewRelevance: 5, // Default medium relevance
            interviewFrequency: 5, // Default medium frequency
            tags: [],
            prerequisites: []
          });
        });
        return enhancedItems;
      }
      
      // Read the metadata file
      const metadataContent = await fs.promises.readFile(this.metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);
      
      // Validate metadata structure
      if (!metadata || !metadata.items) {
        console.warn('RuleBasedOrderer: Invalid metadata structure');
        return enhancedItems;
      }
      
      // Process each item
      for (const item of items) {
        const itemId = item.id;
        
        // Skip if item has no ID
        if (!itemId) {
          console.warn(`RuleBasedOrderer: Item with index ${item.index} has no ID, using default metadata`);
          enhancedItems.set(item.index, {
            id: `generated-${item.index}`,
            complexity: item.complexity || 1,
            interviewRelevance: 5,
            interviewFrequency: 5,
            tags: [],
            prerequisites: []
          });
          continue;
        }
        
        // Find metadata for this item
        const itemMetadata = metadata.items[itemId];
        
        if (!itemMetadata) {
          console.warn(`RuleBasedOrderer: No metadata found for item ${itemId}, using default`);
          enhancedItems.set(item.index, {
            id: itemId,
            complexity: item.complexity || 1,
            interviewRelevance: 5,
            interviewFrequency: 5,
            tags: [],
            prerequisites: []
          });
          continue;
        }
        
        // Store the enhanced item
        enhancedItems.set(item.index, {
          id: itemId,
          complexity: itemMetadata.complexity || item.complexity || 1,
          interviewRelevance: itemMetadata.interviewRelevance || 5,
          interviewFrequency: itemMetadata.interviewFrequency || 5,
          tags: itemMetadata.tags || [],
          prerequisites: itemMetadata.prerequisites || []
        });
      }
      
      console.log(`RuleBasedOrderer: Enhanced ${enhancedItems.size} items with metadata`);
      return enhancedItems;
    } catch (error) {
      console.error('RuleBasedOrderer: Error enhancing items with metadata:', error);
      // Return a default map with basic metadata
      const defaultMap = new Map<number, MetadataItem>();
      items.forEach(item => {
        defaultMap.set(item.index, {
          id: item.id || `generated-${item.index}`,
          complexity: item.complexity || 1,
          prerequisites: []
        });
      });
      return defaultMap;
    }
  }
  
  /**
   * Load dependency graph from graphs.json
   */
  private async loadDependencyGraph(): Promise<Record<string, string[]>> {
    try {
      console.log(`RuleBasedOrderer: Loading dependency graph from ${this.graphsPath}`);
      
      // Create a default empty result
      const dependencies: Record<string, string[]> = {};
      
      // Return empty object if graphs file doesn't exist
      if (!fs.existsSync(this.graphsPath)) {
        console.warn(`RuleBasedOrderer: Dependency graph file not found at ${this.graphsPath}`);
        return dependencies;
      }
      
      // Read the graphs file
      const graphsContent = await fs.promises.readFile(this.graphsPath, 'utf-8');
      const graphs = JSON.parse(graphsContent);
      
      // Validate graphs structure
      if (!graphs || !graphs.dependency || !graphs.dependency.nodes) {
        console.warn('RuleBasedOrderer: Invalid dependency graph structure');
        return dependencies;
      }
      
      // Extract dependencies
      const nodes = graphs.dependency.nodes;
      Object.keys(nodes).forEach(nodeId => {
        dependencies[nodeId] = nodes[nodeId].prerequisites || [];
      });
      
      console.log(`RuleBasedOrderer: Loaded dependencies for ${Object.keys(dependencies).length} items`);
      return dependencies;
    } catch (error) {
      console.error('RuleBasedOrderer: Error loading dependency graph:', error);
      return {};
    }
  }
  
  /**
   * Order each module based on rules
   */
  private async orderModules(
    moduleGroups: ModuleGroup[],
    metadata: Map<number, MetadataItem>,
    dependencyGraph: Record<string, string[]>
  ): Promise<ModuleGroup[]> {
    const orderedModules: ModuleGroup[] = [];
    
    for (const moduleGroup of moduleGroups) {
      console.log(`RuleBasedOrderer: Ordering module ${moduleGroup.moduleId} with ${moduleGroup.items.length} items`);
      
      // Apply topological sort within this module
      const orderedItems = this.topologicalSort(moduleGroup.items, metadata, dependencyGraph);
      
      // Store the ordered module
      orderedModules.push({
        moduleId: moduleGroup.moduleId,
        items: orderedItems
      });
    }
    
    return orderedModules;
  }
  
  /**
   * Apply topological sorting to items within a module
   */
  private topologicalSort(
    items: AggregatedItem[],
    metadata: Map<number, MetadataItem>,
    dependencyGraph: Record<string, string[]>
  ): AggregatedItem[] {
    // Build a map of item IDs to their indices for easy lookup
    const idToItem = new Map<string, AggregatedItem>();
    items.forEach(item => {
      if (item.id) {
        idToItem.set(item.id, item);
      }
    });
    
    // Build graph for topological sort
    const graph = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();
    
    // Initialize graph and in-degree counts
    items.forEach(item => {
      if (item.id) {
        graph.set(item.id, new Set());
        inDegree.set(item.id, 0);
      }
    });
    
    // Build edges based on prerequisites
    items.forEach(item => {
      if (!item.id) return;
      
      const itemMetadata = metadata.get(item.index);
      if (!itemMetadata) return;
      
      // Get prerequisites from both metadata and dependency graph
      const prerequisites = new Set<string>([
        ...(itemMetadata.prerequisites || []),
        ...(dependencyGraph[item.id] || [])
      ]);
      
      prerequisites.forEach(prereqId => {
        // Only consider prerequisites that are in this module
        if (idToItem.has(prereqId)) {
          const prereqItem = idToItem.get(prereqId)!;
          
          // Add edge from prerequisite to item
          graph.get(prereqId)!.add(item.id!);
          
          // Increment in-degree of current item
          inDegree.set(item.id!, (inDegree.get(item.id!) || 0) + 1);
        }
      });
    });
    
    // Kahn's algorithm for topological sort
    const result: AggregatedItem[] = [];
    const queue: string[] = [];
    
    // Start with items that have no prerequisites
    inDegree.forEach((degree, id) => {
      if (degree === 0) {
        queue.push(id);
      }
    });
    
    while (queue.length > 0) {
      // If multiple items are available at this level, sort by tie-breaking rules
      if (queue.length > 1) {
        queue.sort((a, b) => {
          const itemA = idToItem.get(a)!;
          const itemB = idToItem.get(b)!;
          const metadataA = metadata.get(itemA.index);
          const metadataB = metadata.get(itemB.index);
          
          if (!metadataA || !metadataB) return 0;
          
          // Rule 1: Lower complexity first
          const complexityDiff = (metadataA.complexity || 1) - (metadataB.complexity || 1);
          if (complexityDiff !== 0) return complexityDiff;
          
          // Rule 2: Higher interview relevance first
          const relevanceDiff = 
            (metadataB.interviewRelevance || 0) - (metadataA.interviewRelevance || 0);
          if (relevanceDiff !== 0) return relevanceDiff;
          
          // Rule 3: Higher interview frequency first
          const frequencyDiff = 
            (metadataB.interviewFrequency || 0) - (metadataA.interviewFrequency || 0);
          if (frequencyDiff !== 0) return frequencyDiff;
          
          // Rule 4: Higher tag density first
          const tagDensityDiff = 
            (metadataB.tags?.length || 0) - (metadataA.tags?.length || 0);
          return tagDensityDiff;
        });
      }
      
      // Take from queue
      const currentId = queue.shift()!;
      const currentItem = idToItem.get(currentId)!;
      
      // Add to result
      result.push(currentItem);
      
      // Process neighbors
      graph.get(currentId)!.forEach(neighborId => {
        // Decrement in-degree
        inDegree.set(neighborId, inDegree.get(neighborId)! - 1);
        
        // If in-degree becomes 0, add to queue
        if (inDegree.get(neighborId) === 0) {
          queue.push(neighborId);
        }
      });
    }
    
    // Handle cases where there are items without IDs or cycles
    const orderedIds = new Set(result.map(item => item.id));
    const remainingItems = items.filter(item => !item.id || !orderedIds.has(item.id));
    
    // Sort remaining items by complexity
    remainingItems.sort((a, b) => {
      const metadataA = metadata.get(a.index);
      const metadataB = metadata.get(b.index);
      
      return (metadataA?.complexity || 1) - (metadataB?.complexity || 1);
    });
    
    // Combine results
    return [...result, ...remainingItems];
  }
  
  /**
   * Flatten ordered modules back to a single array
   */
  private flattenModules(modules: ModuleGroup[]): AggregatedItem[] {
    return modules.flatMap(module => module.items);
  }
  
  /**
   * Save the ordered items to a JSON file
   */
  private async saveOrderedItems(items: AggregatedItem[]): Promise<void> {
    try {
      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }
      
      const outputPath = path.join(this.outputDir, 'ordered-items.json');
      await fs.promises.writeFile(
        outputPath,
        JSON.stringify(items, null, 2),
        'utf-8'
      );
      
      console.log(`RuleBasedOrderer: Saved ${items.length} ordered items to ${outputPath}`);
    } catch (error) {
      console.error('RuleBasedOrderer: Error saving ordered items:', error);
      throw error;
    }
  }
}
