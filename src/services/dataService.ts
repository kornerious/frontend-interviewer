import type { TheoryItem, QuestionItem, TaskItem, Module } from '@/types';

interface ParsedContent {
  theory: TheoryItem[];
  questions: QuestionItem[];
  tasks: TaskItem[];
}

// Load and parse the database.json file
export const loadDatabase = async (): Promise<ParsedContent> => {
  try {
    const response = await fetch('/database.json');
    const data = await response.json();
    
    // Process the chunks and extract content
    const parsedContent: ParsedContent = {
      theory: [],
      questions: [],
      tasks: []
    };
    
    // Process each chunk and extract content
    for (const chunk of data) {
      if (chunk.parsedContent) {
        if (chunk.parsedContent.theory) {
          parsedContent.theory = [...parsedContent.theory, ...chunk.parsedContent.theory];
        }
        if (chunk.parsedContent.questions) {
          parsedContent.questions = [...parsedContent.questions, ...chunk.parsedContent.questions];
        }
        if (chunk.parsedContent.tasks) {
          parsedContent.tasks = [...parsedContent.tasks, ...chunk.parsedContent.tasks];
        }
      }
    }
    
    return parsedContent;
  } catch (error) {
    console.error('Error loading database:', error);
    throw error;
  }
};

// Build dependency graph for curriculum sequencing
export const buildDependencyGraph = (
  theory: TheoryItem[],
  questions: QuestionItem[],
  tasks: TaskItem[]
) => {
  const graph: Record<string, string[]> = {};
  
  // Process theory items
  theory.forEach(item => {
    graph[item.id] = item.requiredFor || [];
    
    // Add prerequisites as incoming edges
    (item.prerequisites || []).forEach(prereqId => {
      if (!graph[prereqId]) {
        graph[prereqId] = [];
      }
      if (!graph[prereqId].includes(item.id)) {
        graph[prereqId].push(item.id);
      }
    });
  });
  
  // Process questions
  questions.forEach(item => {
    graph[item.id] = [];
    
    // Add prerequisites as incoming edges
    (item.prerequisites || []).forEach(prereqId => {
      if (!graph[prereqId]) {
        graph[prereqId] = [];
      }
      if (!graph[prereqId].includes(item.id)) {
        graph[prereqId].push(item.id);
      }
    });
  });
  
  // Process tasks
  tasks.forEach(item => {
    graph[item.id] = [];
    
    // Add prerequisites as incoming edges
    (item.prerequisites || []).forEach(prereqId => {
      if (!graph[prereqId]) {
        graph[prereqId] = [];
      }
      if (!graph[prereqId].includes(item.id)) {
        graph[prereqId].push(item.id);
      }
    });
  });
  
  return graph;
};

// Perform topological sort to determine learning sequence
export const topologicalSort = (graph: Record<string, string[]>) => {
  const visited: Record<string, boolean> = {};
  const temp: Record<string, boolean> = {};
  const order: string[] = [];
  
  const visit = (node: string) => {
    if (temp[node]) {
      // Cycle detected, skip this node
      return;
    }
    if (visited[node]) {
      return;
    }
    
    temp[node] = true;
    
    // Visit all neighbors
    (graph[node] || []).forEach(neighbor => {
      visit(neighbor);
    });
    
    temp[node] = false;
    visited[node] = true;
    order.unshift(node); // Add to front of array
  };
  
  // Visit all nodes
  Object.keys(graph).forEach(node => {
    if (!visited[node]) {
      visit(node);
    }
  });
  
  return order;
};

// Group modules by learning path and technology
export const groupByLearningPath = (modules: Module[]) => {
  // Group modules by learning path
  const groupedModules: Record<string, Module[]> = {};
  
  modules.forEach(module => {
    const path = module.learningPath;
    if (!groupedModules[path]) {
      groupedModules[path] = [];
    }
    groupedModules[path].push(module);
  });
  
  // Sort each group by complexity
  Object.keys(groupedModules).forEach(path => {
    groupedModules[path].sort((a, b) => a.complexity - b.complexity);
  });
  
  // Convert to array format for the sidebar
  return Object.entries(groupedModules).map(([path, modules]) => ({
    path,
    title: path.charAt(0).toUpperCase() + path.slice(1),
    modules
  }));
};

// Get a random item from the database
export const getRandomItem = (
  modules: Module[]
): { type: 'theory' | 'question' | 'task', item: TheoryItem | QuestionItem | TaskItem } => {
  // Extract all theory, questions, and tasks from modules
  const allTheory: TheoryItem[] = [];
  const allQuestions: QuestionItem[] = [];
  const allTasks: TaskItem[] = [];
  
  modules.forEach(module => {
    if (module.theory) allTheory.push(...module.theory);
    if (module.questions) allQuestions.push(...module.questions);
    if (module.tasks) allTasks.push(...module.tasks);
  });
  
  const allItems = [
    ...allTheory.map(item => ({ type: 'theory' as const, item })),
    ...allQuestions.map(item => ({ type: 'question' as const, item })),
    ...allTasks.map(item => ({ type: 'task' as const, item }))
  ];
  
  if (allItems.length === 0) {
    throw new Error('No items available');
  }
  
  const randomIndex = Math.floor(Math.random() * allItems.length);
  return allItems[randomIndex];
};

// Generate a mock exam based on selected topics and difficulty
export const generateMockExam = (
  theory: TheoryItem[],
  questions: QuestionItem[],
  tasks: TaskItem[],
  topics: string[],
  difficulty: 'easy' | 'medium' | 'hard',
  mcqCount: number,
  openEndedCount: number,
  codingTaskCount: number
) => {
  // Filter by topics
  const filteredQuestions = questions.filter(q => 
    topics.includes(q.topic) || 
    topics.some(topic => q.tags.includes(topic))
  );
  
  const filteredTasks = tasks.filter(t => 
    topics.some(topic => t.tags.includes(topic))
  );
  
  // Filter by difficulty
  const mcqs = filteredQuestions.filter(q => 
    q.type === 'mcq' && q.level === difficulty
  );
  
  const openEnded = filteredQuestions.filter(q => 
    q.type === 'open' && q.level === difficulty
  );
  
  const codingTasks = filteredTasks.filter(t => 
    t.difficulty === difficulty
  );
  
  // Randomly select items
  const selectedMCQs = mcqs
    .sort(() => 0.5 - Math.random())
    .slice(0, mcqCount);
    
  const selectedOpenEnded = openEnded
    .sort(() => 0.5 - Math.random())
    .slice(0, openEndedCount);
    
  const selectedCodingTasks = codingTasks
    .sort(() => 0.5 - Math.random())
    .slice(0, codingTaskCount);
  
  return {
    mcqs: selectedMCQs,
    openEnded: selectedOpenEnded,
    codingTasks: selectedCodingTasks,
    totalTime: selectedMCQs.length * 2 + 
               selectedOpenEnded.length * 5 + 
               selectedCodingTasks.reduce((acc, task) => acc + task.timeEstimate, 0)
  };
};
