import { MetadataItem } from './metadataExtractor';

// Graph interfaces
export interface DependencyGraph {
  [key: string]: string[];
}

export interface SimilarityEdge {
  source: string;
  target: string;
  weight: number;
}

export interface SimilarityGraph {
  nodes: string[];
  edges: SimilarityEdge[];
}

/**
 * Phase 1: Foundational Data Preparation & Analysis
 * Step 2: Building Global Foundational Graphs
 */
export const buildGraphs = (metadata: MetadataItem[]): {
  dependencyGraph: DependencyGraph;
  similarityGraph: SimilarityGraph;
} => {
  console.log('Phase 1, Step 2: Building global dependency and similarity graphs');
  
  // Build dependency graph
  const dependencyGraph: DependencyGraph = {};
  
  // Initialize graph with all items
  metadata.forEach(item => {
    dependencyGraph[item.id] = [];
  });
  
  // Add directed edges based on prerequisites and requiredFor
  metadata.forEach(item => {
    // Add edges from prerequisites to this item
    item.prerequisites.forEach(prereqId => {
      if (dependencyGraph[prereqId]) {
        if (!dependencyGraph[prereqId].includes(item.id)) {
          dependencyGraph[prereqId].push(item.id);
        }
      }
    });
    
    // Add edges from this item to requiredFor
    item.requiredFor.forEach(reqForId => {
      if (dependencyGraph[item.id]) {
        if (!dependencyGraph[item.id].includes(reqForId)) {
          dependencyGraph[item.id].push(reqForId);
        }
      }
    });
  });
  
  // Build similarity graph
  const similarityGraph: SimilarityGraph = {
    nodes: metadata.map(item => item.id),
    edges: []
  };
  
  // Calculate similarity between all pairs of items
  for (let i = 0; i < metadata.length; i++) {
    const itemA = metadata[i];
    
    for (let j = i + 1; j < metadata.length; j++) {
      const itemB = metadata[j];
      
      // Calculate similarity weight based on shared attributes
      let weight = 0;
      
      // Shared tags
      const sharedTags = itemA.tags.filter(tag => itemB.tags.includes(tag));
      weight += sharedTags.length * 2;
      
      // Same technology
      if (itemA.technology && itemB.technology && itemA.technology === itemB.technology) {
        weight += 5;
      }
      
      // Same learning path (significant boost)
      if (itemA.learningPath === itemB.learningPath) {
        weight += 10;
      }
      
      // Related items overlap
      const sharedRelatedItems = itemA.relatedItems.filter(item => 
        itemB.relatedItems.includes(item)
      );
      weight += sharedRelatedItems.length * 3;
      
      // Only add edge if there's some similarity
      if (weight > 0) {
        similarityGraph.edges.push({
          source: itemA.id,
          target: itemB.id,
          weight
        });
      }
    }
  }
  
  console.log(`Built dependency graph with ${Object.keys(dependencyGraph).length} nodes`);
  console.log(`Built similarity graph with ${similarityGraph.nodes.length} nodes and ${similarityGraph.edges.length} edges`);
  
  return { dependencyGraph, similarityGraph };
};
