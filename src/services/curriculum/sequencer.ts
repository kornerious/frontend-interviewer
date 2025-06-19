import { MetadataItem } from './metadataExtractor';
import { DependencyGraph } from './graphBuilder';
import { Cluster } from './analyzer';
import { AIClient } from './aiClient';
import { PromptBuilder } from './promptBuilder';
import { topologicalSort } from '../dataService';

/**
 * Phase 3: Final Aggregation, Refinement, and Assembly
 * Steps 7-8: Optional Final AI Pass and Final Rule-Based Ordering
 */
export class Sequencer {
  private readonly aiClient?: AIClient;
  private readonly promptBuilder: PromptBuilder;
  
  constructor(apiKey?: string) {
    if (apiKey) {
      this.aiClient = new AIClient(apiKey);
    }
    this.promptBuilder = new PromptBuilder();
  }
  
  /**
   * Optional Step 7: Final AI Pass to refine the overall sequence
   */
  async refineSequence(
    clusters: Cluster[],
    metadata: MetadataItem[],
    onProgress?: (message: string) => void
  ): Promise<Cluster[]> {
    if (!this.aiClient) {
      onProgress?.('Skipping final AI refinement pass (no API key provided)');
      return clusters;
    }
    
    onProgress?.('Phase 3, Step 7: Performing final AI pass to refine the overall sequence');
    
    try {
      // Create a map of item IDs to metadata
      const itemsById = new Map<string, MetadataItem>();
      for (const item of metadata) {
        itemsById.set(item.id, item);
      }
      
      // Prepare clusters with full metadata for the AI
      const clustersWithMetadata = clusters.map(cluster => ({
        name: cluster.name,
        items: cluster.items.map(item => itemsById.get(item.id)).filter(Boolean)
      }));
      
      // Build the prompt for sequence refinement
      const prompt = this.promptBuilder.buildSequenceRefinementPrompt(metadata, clustersWithMetadata);
      
      // TODO: Implement the actual API call to Gemini for refinement
      // For now, just return the original clusters
      onProgress?.('Final AI refinement not yet implemented, returning original sequence');
      return clusters;
    } catch (error) {
      onProgress?.(`Error in final AI refinement: ${error.message}`);
      return clusters;
    }
  }
  
  /**
   * Step 8: Final Rule-Based Ordering Within Modules
   */
  orderItemsWithinClusters(
    clusters: Cluster[],
    dependencyGraph: DependencyGraph,
    metadata: MetadataItem[],
    onProgress?: (message: string) => void
  ): Cluster[] {
    onProgress?.('Phase 3, Step 8: Performing final rule-based ordering within modules');
    
    // Create a map of item IDs to metadata
    const itemsById = new Map<string, MetadataItem>();
    for (const item of metadata) {
      itemsById.set(item.id, item);
    }
    
    return clusters.map(cluster => {
      // Create a subgraph for this cluster
      const clusterDependencyGraph: DependencyGraph = {};
      
      // Add all items in this cluster to the subgraph
      for (const item of cluster.items) {
        clusterDependencyGraph[item.id] = [];
      }
      
      // Add edges between items based on prerequisites
      for (const item of cluster.items) {
        const itemMetadata = itemsById.get(item.id);
        if (!itemMetadata) continue;
        
        // Add edges for prerequisites
        for (const prereqId of itemMetadata.prerequisites) {
          // Only add if the prerequisite is in this cluster
          if (cluster.items.some(i => i.id === prereqId)) {
            if (!clusterDependencyGraph[prereqId]) {
              clusterDependencyGraph[prereqId] = [];
            }
            if (!clusterDependencyGraph[prereqId].includes(item.id)) {
              clusterDependencyGraph[prereqId].push(item.id);
            }
          }
        }
        
        // Add edges for requiredFor
        for (const reqForId of itemMetadata.requiredFor) {
          // Only add if the required item is in this cluster
          if (cluster.items.some(i => i.id === reqForId)) {
            if (!clusterDependencyGraph[item.id].includes(reqForId)) {
              clusterDependencyGraph[item.id].push(reqForId);
            }
          }
        }
      }
      
      // Perform topological sort on the cluster subgraph
      const orderedIds = topologicalSort(clusterDependencyGraph);
      
      // For items with the same "layer" in the topological sort,
      // apply tie-breaking rules
      const layerMap = new Map<string, number>();
      let currentLayer = 0;
      let currentLayerItems: string[] = [];
      
      // Identify layers in the topological sort
      for (const id of orderedIds) {
        const prerequisites = Object.entries(clusterDependencyGraph)
          .filter(([_, deps]) => deps.includes(id))
          .map(([prereqId]) => prereqId);
        
        const prereqLayers = prerequisites
          .map(prereqId => layerMap.get(prereqId) || 0);
        
        const maxPrereqLayer = prereqLayers.length > 0
          ? Math.max(...prereqLayers)
          : -1;
        
        if (maxPrereqLayer >= currentLayer) {
          // Process the current layer before moving to the next
          this.applyTieBreakingRules(currentLayerItems, itemsById);
          currentLayer = maxPrereqLayer + 1;
          currentLayerItems = [id];
        } else {
          currentLayerItems.push(id);
        }
        
        layerMap.set(id, currentLayer);
      }
      
      // Process the final layer
      this.applyTieBreakingRules(currentLayerItems, itemsById);
      
      // Map the ordered IDs back to cluster items
      const orderedItems = orderedIds
        .map(id => cluster.items.find(item => item.id === id))
        .filter(Boolean);
      
      // Include any items that weren't in the topological sort
      const includedIds = new Set(orderedIds);
      const remainingItems = cluster.items.filter(item => !includedIds.has(item.id));
      
      return {
        ...cluster,
        items: [...orderedItems, ...remainingItems]
      };
    });
  }
  
  /**
   * Apply tie-breaking rules to items in the same layer
   */
  private applyTieBreakingRules(
    itemIds: string[],
    itemsById: Map<string, MetadataItem>
  ): void {
    if (itemIds.length <= 1) return;
    
    // Sort items by the tie-breaking rules
    itemIds.sort((aId, bId) => {
      const itemA = itemsById.get(aId);
      const itemB = itemsById.get(bId);
      
      if (!itemA || !itemB) return 0;
      
      // Rule 1: Lower complexity first
      const complexityDiff = (itemA.complexity || 5) - (itemB.complexity || 5);
      if (complexityDiff !== 0) return complexityDiff;
      
      // Rule 2: Higher interview relevance/frequency first
      const relevanceA = itemA.type === 'question' 
        ? (itemA.interviewFrequency || 5) 
        : (itemA.interviewRelevance || 5);
        
      const relevanceB = itemB.type === 'question' 
        ? (itemB.interviewFrequency || 5) 
        : (itemB.interviewRelevance || 5);
        
      const relevanceDiff = relevanceB - relevanceA; // Higher first
      if (relevanceDiff !== 0) return relevanceDiff;
      
      // Rule 3: Higher tag density first
      return (itemB.tags?.length || 0) - (itemA.tags?.length || 0);
    });
  }
}
