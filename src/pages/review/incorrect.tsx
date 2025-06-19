import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Button,
  Divider,
  Alert,
  Paper,
  Grid
} from '@mui/material';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import QuizCard from '@/components/questions/QuizCard';
import TaskRunner from '@/components/tasks/TaskRunner';
import { useUserStore, useProgressStore } from '@/store';
import { getIncorrectItems } from '@/services/firestoreService';
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
  
  const loadIncorrectItems = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!uid) {
        throw new Error('User not authenticated');
      }
      
      const items = await getIncorrectItems(uid);
      
      // Separate questions and tasks
      const questions = items.filter(item => item.type === 'question') as QuestionItem[];
      const tasks = items.filter(item => item.type === 'task') as TaskItem[];
      
      setIncorrectQuestions(questions);
      setIncorrectTasks(tasks);
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
      const similar = await generateSimilarItems(item, settings.aiReviewer);
      
      if (item.type === 'question') {
        setSimilarQuestions(similar as QuestionItem[]);
      } else {
        setSimilarTasks(similar as TaskItem[]);
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
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Practice with similar questions
                          </Typography>
                          
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleGenerateSimilar(question)}
                            disabled={generatingSimilar && selectedItemId === question.id}
                          >
                            {generatingSimilar && selectedItemId === question.id ? (
                              <>
                                <CircularProgress size={16} sx={{ mr: 1 }} />
                                Generating...
                              </>
                            ) : (
                              'Generate Similar'
                            )}
                          </Button>
                        </Box>
                        
                        {selectedItemId === question.id && similarQuestions.length > 0 && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Similar Questions:
                            </Typography>
                            
                            {similarQuestions.map((similar) => (
                              <Box key={similar.id} sx={{ mt: 2 }}>
                                <QuizCard question={similar} />
                              </Box>
                            ))}
                          </Box>
                        )}
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
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" color="text.secondary">
                            Practice with similar tasks
                          </Typography>
                          
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            onClick={() => handleGenerateSimilar(task)}
                            disabled={generatingSimilar && selectedItemId === task.id}
                          >
                            {generatingSimilar && selectedItemId === task.id ? (
                              <>
                                <CircularProgress size={16} sx={{ mr: 1 }} />
                                Generating...
                              </>
                            ) : (
                              'Generate Similar'
                            )}
                          </Button>
                        </Box>
                        
                        {selectedItemId === task.id && similarTasks.length > 0 && (
                          <Box sx={{ mt: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              Similar Tasks:
                            </Typography>
                            
                            {similarTasks.map((similar) => (
                              <Box key={similar.id} sx={{ mt: 2 }}>
                                <TaskRunner task={similar} />
                              </Box>
                            ))}
                          </Box>
                        )}
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
