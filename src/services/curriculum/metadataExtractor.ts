import { TheoryItem, QuestionItem, TaskItem } from '@/types';
import fs from 'fs';
import path from 'path';

// Metadata item interface for curriculum generation
export interface MetadataItem {
  id: string;
  index: number;
  type: 'theory' | 'question' | 'task';
  tags: string[];
  technology: string;
  learningPath: string;
  complexity: number;
  prerequisites: string[];
  requiredFor: string[];
  relatedItems: string[];
  interviewRelevance?: number;
  interviewFrequency?: number;
  score: number;
}

export interface TheoryMetadata {
  id: string;
  index: number;
  relatedQuestions: string[];
  relatedTasks: string[];
  tags: string[];
  technology: string;
  prerequisites: string[];
  complexity: number;
  interviewRelevance: number;
  learningPath: string;
  requiredFor: string[];
}

export interface QuestionMetadata {
  id: string;
  index: number;
  topic: string;
  level: string | number;
  type: string;
  analysisPoints: string[];
  keyConcepts: string[];
  evaluationCriteria: string[];
  tags: string[];
  complexity: number;
  interviewFrequency: number;
  learningPath: string;
}

export interface TaskMetadata {
  id: string;
  index: number;
  difficulty: string | number;
  tags: string[];
  prerequisites: string[];
  complexity: number;
  interviewRelevance: number;
  learningPath: string;
  relatedConcepts: string[];
}

export interface ExtractedMetadata {
  theoryMetadata: TheoryMetadata[];
  questionMetadata: QuestionMetadata[];
  taskMetadata: TaskMetadata[];
}

/**
 * Reads database.json from project root and extracts all items
 * @returns Object containing arrays of theory, question, and task items
 */
export function readDatabaseItems(): { theoryItems: any[], questionItems: any[], taskItems: any[] } {
  try {
    // Find the project root (where database.json is located)
    const projectRoot = process.cwd();
    const databasePath = path.join(projectRoot, 'database.json');
    
    if (!fs.existsSync(databasePath)) {
      throw new Error(`Database file not found at ${databasePath}`);
    }
    
    // Read database.json
    const databaseContent = fs.readFileSync(databasePath, 'utf-8');
    const databaseItems = JSON.parse(databaseContent);
    
    // Collect all theory, question, and task items from the database
    const theoryItems: any[] = [];
    const questionItems: any[] = [];
    const taskItems: any[] = [];
    
    // Process each item in the database
    databaseItems.forEach((item: any) => {
      if (item.content) {
        // Extract theory items
        if (item.content.theory && Array.isArray(item.content.theory)) {
          theoryItems.push(...item.content.theory);
        }
        
        // Extract question items
        if (item.content.questions && Array.isArray(item.content.questions)) {
          questionItems.push(...item.content.questions);
        }
        
        // Extract task items
        if (item.content.tasks && Array.isArray(item.content.tasks)) {
          taskItems.push(...item.content.tasks);
        }
      }
    });
    
    return { theoryItems, questionItems, taskItems };
  } catch (error) {
    console.error('Error reading database.json:', error);
    throw error;
  }
}

/**
 * Creates metadata.json file in the project root with extracted metadata
 * @param metadata The extracted metadata object
 */
export function writeMetadataFile(metadata: ExtractedMetadata): void {
  try {
    const projectRoot = process.cwd();
    const metadataPath = path.join(projectRoot, 'metadata.json');
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`Metadata successfully written to ${metadataPath}`);
  } catch (error) {
    console.error('Error writing metadata.json:', error);
    throw error;
  }
}

/**
 * Extracts detailed metadata from all content items and creates metadata.json
 * @returns The extracted metadata object
 */
export function extractAndSaveMetadata(): ExtractedMetadata {
  try {
    // Read items from database.json
    const { theoryItems, questionItems, taskItems } = readDatabaseItems();
    
    console.log(`Found ${theoryItems.length} theory items`);
    console.log(`Found ${questionItems.length} question items`);
    console.log(`Found ${taskItems.length} task items`);
    
    // Extract theory metadata
    const theoryMetadata: TheoryMetadata[] = theoryItems.map((item: any, index: number) => ({
      id: item.id,
      index,
      relatedQuestions: item.relatedQuestions || [],
      relatedTasks: item.relatedTasks || [],
      tags: item.tags || [],
      technology: item.technology || '',
      prerequisites: item.prerequisites || [],
      complexity: item.complexity || 5,
      interviewRelevance: item.interviewRelevance || 5,
      learningPath: item.learningPath || 'beginner',
      requiredFor: item.requiredFor || []
    }));
    
    // Extract question metadata
    const questionMetadata: QuestionMetadata[] = questionItems.map((item: any, index: number) => ({
      id: item.id,
      index,
      topic: item.topic || '',
      level: item.level || 5,
      type: item.type || '',
      analysisPoints: item.analysisPoints || [],
      keyConcepts: item.keyConcepts || [],
      evaluationCriteria: item.evaluationCriteria || [],
      tags: item.tags || [],
      complexity: item.complexity || 5,
      interviewFrequency: item.interviewFrequency || 5,
      learningPath: item.learningPath || 'beginner'
    }));
    
    // Extract task metadata
    const taskMetadata: TaskMetadata[] = taskItems.map((item: any, index: number) => ({
      id: item.id,
      index,
      difficulty: item.difficulty || 5,
      tags: item.tags || [],
      prerequisites: item.prerequisites || [],
      complexity: item.complexity || 5,
      interviewRelevance: item.interviewRelevance || 5,
      learningPath: item.learningPath || 'beginner',
      relatedConcepts: item.relatedConcepts || []
    }));
    
    // Create metadata object
    const metadata: ExtractedMetadata = {
      theoryMetadata,
      questionMetadata,
      taskMetadata
    };
    
    // Write metadata to file
    writeMetadataFile(metadata);
    
    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    throw error;
  }
}

/**
 * Extracts metadata from all content items
 * @param theoryItems Array of theory items
 * @param questionItems Array of question items
 * @param taskItems Array of task items
 * @returns Array of metadata items
 */
export function extractMetadata(
  theoryItems: TheoryItem[],
  questionItems: QuestionItem[],
  taskItems: TaskItem[]
): MetadataItem[] {
  console.log('Phase 1, Step 1: Extracting comprehensive metadata from all items');
  
  const metadata: MetadataItem[] = [];
  
  // Process theory items
  theoryItems.forEach((item, index) => {
    metadata.push({
      id: item.id,
      index,
      type: 'theory',
      tags: item.tags || [],
      technology: item.technology,
      learningPath: item.learningPath || 'beginner',
      complexity: item.complexity || 5,
      prerequisites: item.prerequisites || [],
      requiredFor: item.requiredFor || [],
      relatedItems: [
        ...(item.relatedQuestions || []),
        ...(item.relatedTasks || [])
      ],
      interviewRelevance: item.interviewRelevance || 5,
      score: 0 // Will be calculated later
    });
  });
  
  // Process question items
  questionItems.forEach((item, index) => {
    metadata.push({
      id: item.id,
      index,
      type: 'question',
      tags: item.tags || [],
      technology: item.topic?.split(' ')[0],
      learningPath: item.learningPath || 'beginner',
      complexity: item.complexity || 5,
      prerequisites: item.prerequisites || [],
      requiredFor: [],
      relatedItems: [
        ...(item.keyConcepts || []),
        ...(item.analysisPoints || []),
        ...(item.evaluationCriteria || [])
      ],
      interviewFrequency: item.interviewFrequency || 5,
      score: 0 // Will be calculated later
    });
  });
  
  // Process task items
  taskItems.forEach((item, index) => {
    metadata.push({
      id: item.id,
      index,
      type: 'task',
      tags: item.tags || [],
      technology: item.tags?.[0],
      learningPath: item.learningPath || 'beginner',
      complexity: item.complexity || 5,
      prerequisites: item.prerequisites || [],
      requiredFor: [],
      relatedItems: item.relatedConcepts || [],
      interviewRelevance: item.interviewRelevance || 5,
      score: 0 // Will be calculated later
    });
  });
  
  console.log(`Extracted metadata for ${metadata.length} items`);
  return metadata;
};
