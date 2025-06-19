import { TheoryItem, QuestionItem, TaskItem, Module } from '@/types';
import { MetadataItem } from './metadataExtractor';
import { Cluster } from './analyzer';
import { db } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

/**
 * Phase 3: Final Aggregation, Refinement, and Assembly
 * Steps 9-10: Interleave Content and Compose Final Curriculum
 */
export class Writer {
  /**
   * Step 9: Interleave Content for Pedagogical Flow
   */
  interleaveRelatedContent(
    clusters: Cluster[],
    theoryItems: TheoryItem[],
    questionItems: QuestionItem[],
    taskItems: TaskItem[],
    onProgress?: (message: string) => void
  ): Cluster[] {
    onProgress?.('Phase 3, Step 9: Interleaving related content for pedagogical flow');
    
    // Create maps for quick lookup
    const theoryMap = new Map<string, TheoryItem>();
    theoryItems.forEach(item => theoryMap.set(item.id, item));
    
    const questionMap = new Map<string, QuestionItem>();
    questionItems.forEach(item => questionMap.set(item.id, item));
    
    const taskMap = new Map<string, TaskItem>();
    taskItems.forEach(item => taskMap.set(item.id, item));
    
    // Process each cluster
    return clusters.map(cluster => {
      const interleaved: typeof cluster.items = [];
      
      // Process each item in the cluster
      for (let i = 0; i < cluster.items.length; i++) {
        const item = cluster.items[i];
        interleaved.push(item);
        
        // If this is a theory item, interleave its related questions and tasks
        const theoryItem = theoryMap.get(item.id);
        if (theoryItem) {
          // Get related questions
          const relatedQuestions = (theoryItem.relatedQuestions || [])
            .map(id => {
              const question = questionMap.get(id);
              if (!question) return null;
              
              // Find if this question is already in the cluster
              const existingIndex = cluster.items.findIndex(i => i.id === id);
              if (existingIndex > i) {
                // If it's later in the sequence, we'll interleave it here
                // and remove it from its original position later
                return {
                  id,
                  index: questionItems.findIndex(q => q.id === id),
                  score: 0
                };
              }
              return null;
            })
            .filter(Boolean);
          
          // Get related tasks
          const relatedTasks = (theoryItem.relatedTasks || [])
            .map(id => {
              const task = taskMap.get(id);
              if (!task) return null;
              
              // Find if this task is already in the cluster
              const existingIndex = cluster.items.findIndex(i => i.id === id);
              if (existingIndex > i) {
                // If it's later in the sequence, we'll interleave it here
                // and remove it from its original position later
                return {
                  id,
                  index: taskItems.findIndex(t => t.id === id),
                  score: 0
                };
              }
              return null;
            })
            .filter(Boolean);
          
          // Add related content
          interleaved.push(...relatedQuestions, ...relatedTasks);
        }
      }
      
      // Remove duplicates (keeping the first occurrence)
      const seen = new Set<string>();
      const deduplicated = interleaved.filter(item => {
        if (seen.has(item.id)) {
          return false;
        }
        seen.add(item.id);
        return true;
      });
      
      return {
        ...cluster,
        items: deduplicated
      };
    });
  }
  
  /**
   * Step 10: Compose Final Curriculum
   */
  composeFinalCurriculum(
    clusters: Cluster[],
    theoryItems: TheoryItem[],
    questionItems: QuestionItem[],
    taskItems: TaskItem[],
    onProgress?: (message: string) => void
  ): Module[] {
    onProgress?.('Phase 3, Step 10: Composing final curriculum');
    
    // Create maps for quick lookup
    const theoryMap = new Map<string, TheoryItem>();
    theoryItems.forEach(item => theoryMap.set(item.id, item));
    
    const questionMap = new Map<string, QuestionItem>();
    questionItems.forEach(item => questionMap.set(item.id, item));
    
    const taskMap = new Map<string, TaskItem>();
    taskItems.forEach(item => taskMap.set(item.id, item));
    
    // Convert clusters to modules
    const modules: Module[] = clusters.map((cluster, index) => {
      // Map items back to their full objects
      const moduleItems = cluster.items.map(item => {
        const theory = theoryMap.get(item.id);
        if (theory) return { type: 'theory', item: theory };
        
        const question = questionMap.get(item.id);
        if (question) return { type: 'question', item: question };
        
        const task = taskMap.get(item.id);
        if (task) return { type: 'task', item: task };
        
        return null;
      }).filter(Boolean);
      
      return {
        id: `module-${index + 1}`,
        name: cluster.name,
        description: `A module focused on ${cluster.name} concepts`,
        technology: cluster.technology || 'general',
        learningPath: cluster.learningPath || 'beginner',
        items: moduleItems,
        position: index + 1
      };
    });
    
    onProgress?.(`Composed final curriculum with ${modules.length} modules`);
    return modules;
  }
  
  /**
   * Save the curriculum to Firestore
   */
  async saveCurriculumToFirestore(
    modules: Module[],
    onProgress?: (message: string) => void
  ): Promise<void> {
    onProgress?.('Saving curriculum to Firestore');
    
    try {
      // Save the curriculum to Firestore
      await setDoc(doc(db, 'system', 'curriculum'), {
        modules,
        createdAt: new Date().toISOString(),
        version: '1.0'
      });
      
      onProgress?.('Successfully saved curriculum to Firestore');
    } catch (error) {
      onProgress?.(`Error saving curriculum to Firestore: ${error.message}`);
      throw error;
    }
  }
}
