// Import types from root index.ts
import type { TheoryItem, QuestionItem, TaskItem, Technology, Difficulty, QuestionType, CodeExample } from '../../index';

// Re-export types
export type { TheoryItem, QuestionItem, TaskItem, Technology, Difficulty, QuestionType, CodeExample };

// Define Module interface
export interface Module {
  id: string;
  title: string;
  path: string;
  description: string;
  technology: Technology;
  learningPath: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  complexity: number;
  prerequisites: string[];
  theory: TheoryItem[];
  questions: QuestionItem[];
  tasks: TaskItem[];
  tags: string[];
}

export interface UserSettings {
  username: string;
  aiReviewer: 'deepseek' | 'gemini' | 'both';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProgress {
  completedItems: Record<string, boolean>;
  incorrectItems: Record<string, boolean>;
}

export interface UserSubmission {
  id: string;
  itemId: string;
  userId: string;
  content: string;
  result: 'pass' | 'fail';
  feedback: string;
  timestamp: string;
}

export interface MockExam {
  id: string;
  title: string;
  technology: string;
  duration: number; // in minutes
  questions: QuestionItem[];
  tasks: TaskItem[];
  userId: string;
  startedAt?: string;
  completedAt?: string;
  currentItemIndex?: number;
  completed: boolean;
  score: number;
  totalPoints: number;
}

export interface AIReviewRequest {
  itemId: string;
  type: 'task' | 'question';
  prompt: string;
  userCode: string;
  testCases?: string[];
}

export interface AIReviewResponse {
  isCorrect: boolean;
  feedback: string;
  score?: number;
  suggestions?: string[];
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface UserState {
  isAuthenticated: boolean;
  uid: string | null;
  settings: UserSettings;
  setAuthenticated: (isAuthenticated: boolean, uid: string | null) => void;
  setSettings: (settings: UserSettings) => void;
  logout: () => void;
}

export interface DataState {
  modules: Module[];
  technologies: string[];
  learningPaths: string[];
  loadData: () => Promise<{ modules: Module[]; technologies: string[]; learningPaths: string[] }>;
  getModuleByPath: (path: string) => Module | null;
  getModuleById: (id: string) => Module | null;
  getRandomTheory: (technology?: string) => TheoryItem | null;
  getRandomQuestion: (technology?: string, difficulty?: string) => QuestionItem | null;
  getRandomTask: (technology?: string, difficulty?: string) => TaskItem | null;
}

export interface ProgressState {
  completedItems: Record<string, boolean>;
  incorrectItems: Record<string, boolean>;
  setCompleted: (itemId: string, completed: boolean) => void;
  setIncorrect: (itemId: string, incorrect: boolean) => void;
  resetProgress: () => void;
  loadProgress: (userId: string) => Promise<void>;
}
