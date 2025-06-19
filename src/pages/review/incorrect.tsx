import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Alert,
  Paper,
  Grid
} from '@mui/material';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import QuizCard from '@/components/questions/QuizCard';
import TaskRunner from '@/components/tasks/TaskRunner';
import SimilarItemsSection from '@/components/review/SimilarItemsSection';
import { useUserStore, useProgressStore } from '@/store';
// Using the available functions from firestoreService
import { getSubmissions, getAllProgress } from '@/services/firestoreService';
import { generateSimilarItems } from '@/services/aiService';
import { QuestionItem, TaskItem } from '../../../index';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`incorrect-tabpanel-${index}`}
      aria-labelledby={`incorrect-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const IncorrectItemsPage = () => {
  const router = useRouter();
  const { isAuthenticated, uid, settings } = useUserStore();
  const { incorrectItems } = useProgressStore();
  
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [incorrectQuestions, setIncorrectQuestions] = useState<QuestionItem[]>([]);
  const [incorrectTasks, setIncorrectTasks] = useState<TaskItem[]>([]);
  const [similarQuestions, setSimilarQuestions] = useState<QuestionItem[]>([]);
  const [similarTasks, setSimilarTasks] = useState<TaskItem[]>([]);
  const [generatingSimilar, setGeneratingSimilar] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  // Load incorrect items on initial render
  useEffect(() => {
    if (isAuthenticated && uid) {
      loadIncorrectItems();
    }
  }, [isAuthenticated, uid]);
  
  // Type guard to check if an item is a QuestionItem
  const isQuestionItem = (item: any): item is QuestionItem => {
    return 'type' in item && item.type !== undefined;
  };

  const loadIncorrectItems = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!uid) {
        throw new Error('User not authenticated');
      }
      
      // Get user progress from Firestore
      // This will give us the incorrectItems to display
      const progress = await getAllProgress(uid);
      
      // Get the actual items from the incorrectItems in the store
      const items: (QuestionItem | TaskItem)[] = [];
      
      // In a real implementation, we would fetch the actual items
      // For now, we'll just use mock data
      const mockQuestions: QuestionItem[] = [
        {
          id: 'q1',
          topic: 'React Hooks',
          level: 'medium',
          type: 'mcq',
          question: 'What is the correct way to update state in React?',
          answer: '1',
          example: '',
          tags: ['React', 'Hooks'],
          options: [
            'Using setState', 
            'Directly modifying the state object', 
            'Using refs', 
            'None of the above'
          ],
          analysisPoints: [],
          keyConcepts: [],
          evaluationCriteria: [],
          prerequisites: [],
          complexity: 3,
          interviewFrequency: 8,
          learningPath: 'beginner',
          irrelevant: false
        }
      ];
      
      const mockTasks: TaskItem[] = [
        {
          id: 't1',
          title: 'Create a Counter Component',
          description: 'Create a simple counter using React hooks',
          difficulty: 'easy',
          startingCode: 'function Counter() {\n  // Your code here\n}',
          solutionCode: 'function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n    </div>\n  );\n}',
          testCases: ['Should render a counter with initial value 0', 'Should increment when button is clicked'],
          hints: ['Use the useState hook', 'Remember to handle the click event'],
          tags: ['React', 'Hooks'],
          timeEstimate: 10,
          prerequisites: [],
          complexity: 2,
          interviewRelevance: 7,
          learningPath: 'beginner',
          relatedConcepts: []
        }
      ];
      
      setIncorrectQuestions(mockQuestions);
      setIncorrectTasks(mockTasks);
    } catch (err: any) {
      setError(err.message || 'Failed to load incorrect items');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleGenerateSimilar = async (item: QuestionItem | TaskItem) => {
    setGeneratingSimilar(true);
    setSelectedItemId(item.id);
    setSimilarQuestions([]);
    setSimilarTasks([]);
    
    try {
      // Type guard to check if an item is a QuestionItem
      const isQuestionItem = (item: QuestionItem | TaskItem): item is QuestionItem => {
        return 'type' in item && (item as QuestionItem).type !== undefined;
      };
      
      // In a real implementation, we would call the AI service
      // For now, we'll just use mock data
      const mockSimilarQuestions: QuestionItem[] = [
        {
          id: 'sq1',
          topic: 'React Hooks',
          level: 'medium',
          type: 'mcq',
          question: 'What hook should be used for side effects in React?',
          answer: '0',
          example: '',
          tags: ['React', 'Hooks'],
          options: [
            'useEffect', 
            'useState', 
            'useContext', 
            'useReducer'
          ],
          analysisPoints: [],
          keyConcepts: [],
          evaluationCriteria: [],
          prerequisites: [],
          complexity: 3,
          interviewFrequency: 7,
          learningPath: 'beginner',
          irrelevant: false
        }
      ];
      
      const mockSimilarTasks: TaskItem[] = [
        {
          id: 'st1',
          title: 'Create a Toggle Component',
          description: 'Create a simple toggle switch using React hooks',
          difficulty: 'easy',
          startingCode: 'function Toggle() {\n  // Your code here\n}',
          solutionCode: 'function Toggle() {\n  const [isOn, setIsOn] = useState(false);\n  return (\n    <button onClick={() => setIsOn(!isOn)}>\n      {isOn ? "ON" : "OFF"}\n    </button>\n  );\n}',
          testCases: ['Should render a toggle with initial state OFF', 'Should toggle between ON and OFF when clicked'],
          hints: ['Use the useState hook', 'Use conditional rendering for the button text'],
          tags: ['React', 'Hooks'],
          timeEstimate: 10,
          prerequisites: [],
          complexity: 2,
          interviewRelevance: 6,
          learningPath: 'beginner',
          relatedConcepts: []
        }
      ];
      
      if (isQuestionItem(item)) {
        setSimilarQuestions(mockSimilarQuestions);
      } else {
        setSimilarTasks(mockSimilarTasks);
      }
    } catch (err: any) {
      console.error('Error generating similar items:', err);
    } finally {
      setGeneratingSimilar(false);
    }
  };
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <Layout>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Review Incorrect Items
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Review items you previously answered incorrectly and practice with similar AI-generated items.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="incorrect items tabs"
          >
            <Tab 
              label={`Questions (${incorrectQuestions.length})`} 
              id="incorrect-tab-0" 
              aria-controls="incorrect-tabpanel-0" 
            />
            <Tab 
              label={`Tasks (${incorrectTasks.length})`} 
              id="incorrect-tab-1" 
              aria-controls="incorrect-tabpanel-1" 
            />
          </Tabs>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              {incorrectQuestions.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  You don't have any incorrect questions yet. Keep practicing!
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {incorrectQuestions.map((question) => (
                    <Grid item xs={12} key={question.id}>
                      <Paper sx={{ p: 2, mb: 2 }}>
                        <QuizCard question={question} />
                        
                        <SimilarItemsSection
                          item={question}
                          similarItems={similarQuestions}
                          selectedItemId={selectedItemId}
                          generatingSimilar={generatingSimilar}
                          onGenerateSimilar={handleGenerateSimilar}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              {incorrectTasks.length === 0 ? (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  You don't have any incorrect tasks yet. Keep practicing!
                </Typography>
              ) : (
                <Grid container spacing={3}>
                  {incorrectTasks.map((task) => (
                    <Grid item xs={12} key={task.id}>
                      <Paper sx={{ p: 2, mb: 2 }}>
                        <TaskRunner task={task} />
                        
                        <SimilarItemsSection
                          item={task}
                          similarItems={similarTasks}
                          selectedItemId={selectedItemId}
                          generatingSimilar={generatingSimilar}
                          onGenerateSimilar={handleGenerateSimilar}
                        />
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              )}
            </TabPanel>
          </>
        )}
      </Box>
    </Layout>
  );
};

export default IncorrectItemsPage;
