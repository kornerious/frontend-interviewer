import { MetadataItem } from './metadataExtractor';
import { DependencyGraph } from './graphBuilder';
import { Cluster } from './analyzer';
import { topologicalSort } from '../dataService';

/**
 * Phase 3: Final Aggregation, Refinement, and Assembly
 * Step 6: Merge, Deduplicate, and Resolve Dependencies
 */
export class Aggregator {
  /**
   * Merge clusters from multiple chunks
   */
  mergeClusters(clusterSets: Cluster[][]): Cluster[] {
    console.log('Phase 3, Step 6: Merging clusters from all chunks');
    
    const mergedClusters: Cluster[] = [];
    const clustersByName = new Map<string, Cluster>();
    
    // First pass: Group clusters by name
    for (const clusters of clusterSets) {
      for (const cluster of clusters) {
        const existingCluster = clustersByName.get(cluster.name);
        
        if (existingCluster) {
          // Merge items into existing cluster
          existingCluster.items.push(...cluster.items);
        } else {
          // Add new cluster
          clustersByName.set(cluster.name, {
            name: cluster.name,
            technology: cluster.technology,
            learningPath: cluster.learningPath,
            items: [...cluster.items]
          });
        }
      }
    }
    
    // Second pass: Deduplicate items within each cluster
    for (const [name, cluster] of clustersByName.entries()) {
      const uniqueItems = new Map<string, typeof cluster.items[0]>();
      
      for (const item of cluster.items) {
        if (!uniqueItems.has(item.id)) {
          uniqueItems.set(item.id, item);
        }
      }
      
      mergedClusters.push({
        name,
        technology: cluster.technology,
        learningPath: cluster.learningPath,
        items: Array.from(uniqueItems.values())
      });
    }
    
    console.log(`Merged into ${mergedClusters.length} clusters with ${mergedClusters.reduce((sum, c) => sum + c.items.length, 0)} total items`);
    return mergedClusters;
  }
  
  /**
   * Resolve cross-cluster dependencies
   */
  resolveDependencies(
    clusters: Cluster[],
    dependencyGraph: DependencyGraph,
    metadata: MetadataItem[]
  ): Cluster[] {
    console.log('Phase 3, Step 6: Resolving cross-cluster dependencies');
    
    // Create a map of item IDs to their clusters
    const itemToCluster = new Map<string, string>();
    for (const cluster of clusters) {
      for (const item of cluster.items) {
        itemToCluster.set(item.id, cluster.name);
      }
    }
    
    // Create a map of item IDs to metadata
    const itemsById = new Map<string, MetadataItem>();
    for (const item of metadata) {
      itemsById.set(item.id, item);
    }
    
    // Create a dependency graph between clusters
    const clusterDependencyGraph: Record<string, string[]> = {};
    for (const cluster of clusters) {
      clusterDependencyGraph[cluster.name] = [];
    }
    
    // Add edges between clusters based on item dependencies
    for (const [itemId, dependencies] of Object.entries(dependencyGraph)) {
      const sourceCluster = itemToCluster.get(itemId);
      if (!sourceCluster) continue;
      
      for (const dependentId of dependencies) {
        const targetCluster = itemToCluster.get(dependentId);
        if (!targetCluster || targetCluster === sourceCluster) continue;
        
        if (!clusterDependencyGraph[sourceCluster].includes(targetCluster)) {
          clusterDependencyGraph[sourceCluster].push(targetCluster);
        }
      }
    }
    
    // Perform topological sort on clusters
    const clusterOrder = topologicalSort(clusterDependencyGraph);
    
    // Reorder clusters based on dependencies
    const orderedClusters = clusterOrder
      .map(name => clusters.find(c => c.name === name))
      .filter(Boolean);
    
    // For any clusters not in the topological sort, add them at the end
    const includedClusters = new Set(clusterOrder);
    const remainingClusters = clusters.filter(c => !includedClusters.has(c.name));
    
    return [...orderedClusters, ...remainingClusters];
  }
}
