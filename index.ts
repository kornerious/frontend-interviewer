/**
 * Types for chunk testing feature
 */
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'mcq' | 'code' | 'open' | 'flashcard';
export type Technology = 'React' | 'Next.js' | 'TypeScript' | 'JavaScript' | 'MUI' | 'Testing' | 'Performance' | 'CSS' | 'HTML' | 'Other' ;

export interface TestChunk {
  id: string;
  startLine: number;
  endLine: number;
  content: string;
  processedDate: string;
  completed: boolean;
  parsedContent?: ParsedContent;
}

export interface ParsedContent {
  theory: TheoryItem[];
  questions: QuestionItem[];
  tasks: TaskItem[];
}

export interface TheoryItem {
id: string;
  title: string;
  content: string;
  examples: CodeExample[];
  relatedQuestions: string[]; // Question IDs
  relatedTasks: string[]; // CodeTask IDs
  tags: string[];
  technology: Technology;
  irrelevant: boolean;
  // Fields for learning plan optimization
  prerequisites: string[]; // Essential for sequencing
  complexity: number; // 1-10 scale of conceptual difficulty
  interviewRelevance: number; // 1-10 scale of relevance to interviews
  learningPath: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  requiredFor: string[]; // Content that depends on this theory
}

export interface QuestionItem {
  id: string;
  topic: string;
  level: Difficulty;
  type: QuestionType;
  question: string;
  answer: string;
  example: string;
  tags: string[];
  options: string[];
  analysisPoints: string[];
  keyConcepts: string[];
  evaluationCriteria: string[];
  irrelevant: boolean;
  // Fields for learning plan optimization
  prerequisites: string[]; // Essential for sequencing
  complexity: number; // 1-10 scale of conceptual difficulty
  interviewFrequency: number; // 1-10 scale of how often asked in interviews
  learningPath: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface TaskItem {
id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  startingCode: string;
  solutionCode: string;
  testCases: string[];
  hints: string[];
  tags: string[];
  timeEstimate: number; // in minutes
  
  // Fields for learning plan optimization
  prerequisites: string[]; // Essential for sequencing
  complexity: number; // 1-10 scale of implementation difficulty
  interviewRelevance: number; // 1-10 scale of relevance to interviews
  learningPath: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  relatedConcepts: string[]; // Links to theory concepts
}

export interface ProcessingResult {
  chunk: TestChunk;
  parsedContent: ParsedContent;
}

export interface ProcessingError {
  chunkIndex: number;
  startLine: number;
  endLine: number;
  error: Error | string;
}

export interface SequentialProcessingResult {
  results: ProcessingResult[];
  errors: ProcessingError[];
  processedCount: number;
  totalChunks: number;
}

export type CodeExample = {
  id: string;
  title: string;
  code: string;
  explanation: string;
  language: 'typescript' | 'javascript' | 'jsx' | 'tsx' | 'html' | 'css';
};