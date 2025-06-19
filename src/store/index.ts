import { create } from 'zustand';
import type { 
  TheoryItem, 
  QuestionItem, 
  TaskItem, 
  Technology, 
  UserSettings, 
  UserState, 
  DataState,
  ProgressState,
  Module
} from '@/types';

// User store for authentication and settings

export const useUserStore = create<UserState>((set) => ({
  isAuthenticated: false,
  uid: null,
  settings: {
    username: '',
    aiReviewer: 'both',
  },
  setAuthenticated: (isAuthenticated, uid) => set({ isAuthenticated, uid }),
  setSettings: (settings) => set({ settings }),
  logout: () => set({ isAuthenticated: false, uid: null }),
}));

// Data store for modules, theory, questions, and tasks
export const useDataStore = create<DataState>((set, get) => ({
  modules: [],
  technologies: [],
  learningPaths: [],
  loadData: async () => {
    try {
      // Load data from database.json file in the root directory
      const response = await fetch('/database.json');
      const data = await response.json();
      
      // Process the data into modules
      const modules: Module[] = [];
      const technologies = new Set<string>();
      const learningPaths = new Set<string>();
      
      // Process each chunk and extract content
      for (const chunk of data) {
        if (chunk.parsedContent) {
          // Extract modules
          if (chunk.modules) {
            modules.push(...chunk.modules);
          }
          
          // Extract from parsed content if modules not available
          if (!chunk.modules && chunk.parsedContent) {
            const { theory = [], questions = [], tasks = [] } = chunk.parsedContent;
            
            // Group by technology and learning path
            const moduleMap = new Map<string, Module>();
            
            // Process theory items
            theory.forEach((item: TheoryItem) => {
              const key = `${item.technology}_${item.learningPath}`;
              technologies.add(item.technology);
              learningPaths.add(item.learningPath);
              
              if (!moduleMap.has(key)) {
                moduleMap.set(key, {
                  id: key,
                  title: `${item.technology} - ${item.learningPath.charAt(0).toUpperCase() + item.learningPath.slice(1)}`,
                  path: key,
                  description: `${item.technology} concepts for ${item.learningPath} developers`,
                  technology: item.technology as Technology,
                  learningPath: item.learningPath as any,
                  complexity: ['beginner', 'intermediate', 'advanced', 'expert'].indexOf(item.learningPath),
                  prerequisites: [],
                  theory: [],
                  questions: [],
                  tasks: [],
                  tags: [item.technology]
                });
              }
              
              const module = moduleMap.get(key)!;
              module.theory.push(item);
            });
            
            // Process questions
            questions.forEach((item: QuestionItem) => {
              const tech = item.topic.split(' ')[0] as Technology;
              const key = `${tech}_${item.learningPath}`;
              technologies.add(tech);
              learningPaths.add(item.learningPath);
              
              if (!moduleMap.has(key)) {
                moduleMap.set(key, {
                  id: key,
                  title: `${tech} - ${item.learningPath.charAt(0).toUpperCase() + item.learningPath.slice(1)}`,
                  path: key,
                  description: `${tech} concepts for ${item.learningPath} developers`,
                  technology: tech,
                  learningPath: item.learningPath as any,
                  complexity: ['beginner', 'intermediate', 'advanced', 'expert'].indexOf(item.learningPath),
                  prerequisites: [],
                  theory: [],
                  questions: [],
                  tasks: [],
                  tags: [tech]
                });
              }
              
              const module = moduleMap.get(key)!;
              module.questions.push(item);
            });
            
            // Process tasks
            tasks.forEach((item: TaskItem) => {
              const techTag = item.tags.find(tag => 
                ['React', 'Next.js', 'TypeScript', 'JavaScript', 'MUI', 'Testing', 'Performance', 'CSS', 'HTML'].includes(tag)
              ) as Technology || 'JavaScript';
              
              const key = `${techTag}_${item.learningPath}`;
              technologies.add(techTag);
              learningPaths.add(item.learningPath);
              
              if (!moduleMap.has(key)) {
                moduleMap.set(key, {
                  id: key,
                  title: `${techTag} - ${item.learningPath.charAt(0).toUpperCase() + item.learningPath.slice(1)}`,
                  path: key,
                  description: `${techTag} concepts for ${item.learningPath} developers`,
                  technology: techTag,
                  learningPath: item.learningPath as any,
                  complexity: ['beginner', 'intermediate', 'advanced', 'expert'].indexOf(item.learningPath),
                  prerequisites: [],
                  theory: [],
                  questions: [],
                  tasks: [],
                  tags: [techTag]
                });
              }
              
              const module = moduleMap.get(key)!;
              module.tasks.push(item);
            });
            
            // Add all modules from this chunk
            modules.push(...Array.from(moduleMap.values()));
          }
        }
      }
      
      // Update the store
      set({
        modules,
        technologies: Array.from(technologies),
        learningPaths: Array.from(learningPaths)
      });
      
      return { modules, technologies: Array.from(technologies), learningPaths: Array.from(learningPaths) };
    } catch (error) {
      console.error('Error loading data:', error);
      return { modules: [], technologies: [], learningPaths: [] };
    }
  },
  getModuleByPath: (path) => {
    const { modules } = get();
    return modules.find(module => module.path === path) || null;
  },
  getModuleById: (id) => {
    const { modules } = get();
    return modules.find(module => module.id === id) || null;
  },
  getRandomTheory: (technology) => {
    const { modules } = get();
    const filteredModules = technology 
      ? modules.filter(m => m.technology === technology)
      : modules;
    
    if (filteredModules.length === 0) return null;
    
    const allTheory = filteredModules.flatMap(m => m.theory);
    if (allTheory.length === 0) return null;
    
    return allTheory[Math.floor(Math.random() * allTheory.length)];
  },
  getRandomQuestion: (technology, difficulty) => {
    const { modules } = get();
    let filteredModules = modules;
    
    if (technology) {
      filteredModules = filteredModules.filter(m => m.technology === technology);
    }
    
    if (filteredModules.length === 0) return null;
    
    let allQuestions = filteredModules.flatMap(m => m.questions);
    
    if (difficulty) {
      allQuestions = allQuestions.filter(q => q.level === difficulty);
    }
    
    if (allQuestions.length === 0) return null;
    
    return allQuestions[Math.floor(Math.random() * allQuestions.length)];
  },
  getRandomTask: (technology, difficulty) => {
    const { modules } = get();
    let filteredModules = modules;
    
    if (technology) {
      filteredModules = filteredModules.filter(m => m.technology === technology);
    }
    
    if (filteredModules.length === 0) return null;
    
    let allTasks = filteredModules.flatMap(m => m.tasks);
    
    if (difficulty) {
      allTasks = allTasks.filter(t => t.difficulty === difficulty);
    }
    
    if (allTasks.length === 0) return null;
    
    return allTasks[Math.floor(Math.random() * allTasks.length)];
  }
}));

// Progress store for tracking completed and incorrect items
export const useProgressStore = create<ProgressState>((set) => ({
  completedItems: {},
  incorrectItems: {},
  setCompleted: (itemId, completed) => 
    set((state) => ({
      completedItems: { 
        ...state.completedItems, 
        [itemId]: completed 
      }
    })),
  setIncorrect: (itemId, incorrect) => 
    set((state) => ({
      incorrectItems: { 
        ...state.incorrectItems, 
        [itemId]: incorrect 
      }
    })),
  resetProgress: () => set({ completedItems: {}, incorrectItems: {} }),
  loadProgress: async (userId) => {
    try {
      // In a real app, this would fetch from Firebase
      const response = await fetch(`/api/progress?userId=${userId}`);
      const data = await response.json();
      set({ 
        completedItems: data.completedItems || {},
        incorrectItems: data.incorrectItems || {}
      });
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }
}));
