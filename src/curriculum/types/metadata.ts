/**
 * Types for curriculum metadata extraction
 */
import { 
  TheoryItem, 
  QuestionItem, 
  TaskItem, 
  Technology, 
  Difficulty 
} from '../../../index';

/**
 * Base metadata interface for all curriculum items
 */
export interface BaseMetadataItem {
  id: string;
  title: string;
  type: 'theory' | 'question' | 'task';
  tags: string[];
  technology: Technology[];
  complexity: number;
  learningPath: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  prerequisites: string[];
  originalIndex: number; // Index in the original database.json
}

/**
 * Theory item specific metadata
 */
export interface TheoryMetadata extends BaseMetadataItem {
  type: 'theory';
  difficulty: Difficulty;
  interviewRelevance: number;
  relatedQuestions: string[];
  relatedTasks: string[];
  requiredFor: string[];
}

/**
 * Question item specific metadata
 */
export interface QuestionMetadata extends BaseMetadataItem {
  type: 'question';
  topic: string;
  level: Difficulty;
  difficulty: Difficulty;
  interviewFrequency: number;
  relatedTheory: string[];
  analysisPoints: string[];
  keyConcepts: string[];
  evaluationCriteria: string[];
  questionType: string;
}

/**
 * Task item specific metadata
 */
export interface TaskMetadata extends BaseMetadataItem {
  type: 'task';
  difficulty: Difficulty;
  interviewRelevance: number;
  relatedTheory: string[];
  relatedConcepts: string[];
}

/**
 * Union type for all metadata items
 */
export type MetadataItem = TheoryMetadata | QuestionMetadata | TaskMetadata;

/**
 * Extracted metadata from database.json
 */
export interface ExtractedMetadata {
  items: MetadataItem[];
  stats: {
    theoryItems: number;
    questionItems: number;
    taskItems: number;
    totalItems: number;
  };
  dependencyGraph: DependencyGraph;
  similarityGraph: SimilarityGraph;
  initialScores: Record<string, ItemScore>;
}

/**
 * Dependency graph representation
 */
export interface DependencyGraph {
  nodes: string[]; // Item IDs
  edges: Array<{
    source: string; // Item ID
    target: string; // Item ID
    type: 'prerequisite' | 'requiredFor';
  }>;
}

/**
 * Similarity graph representation
 */
export interface SimilarityGraph {
  nodes: string[]; // Item IDs
  edges: Array<{
    source: string; // Item ID
    target: string; // Item ID
    weight: number; // Similarity score (0-1)
  }>;
}

/**
 * Score components for each item
 */
export interface ItemScore {
  id: string;
  prerequisiteDepth: number; // How deep in the prerequisite chain
  difficultyScore: number; // Normalized complexity/difficulty
  relevanceScore: number; // Normalized interview relevance
  thematicCohesion: number; // Based on tag density and connections
  totalScore: number; // Weighted combination of above scores
}
