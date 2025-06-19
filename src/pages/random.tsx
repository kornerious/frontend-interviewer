import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Tabs, 
  Tab,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import Layout from '@/components/layout/Layout';
import QuizCard from '@/components/questions/QuizCard';
import TaskRunner from '@/components/tasks/TaskRunner';
import TheoryCard from '@/components/theory/TheoryCard';
import TheoryView from '@/components/theory/TheoryView';
import { useDataStore } from '@/store';
import { TheoryItem, QuestionItem, TaskItem } from '../../index';

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
      id={`random-tabpanel-${index}`}
      aria-labelledby={`random-tab-${index}`}
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

const RandomPage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [technology, setTechnology] = useState<string>('all');
  const [difficulty, setDifficulty] = useState<string>('all');
  
  const [randomTheory, setRandomTheory] = useState<TheoryItem | null>(null);
  const [randomQuestion, setRandomQuestion] = useState<QuestionItem | null>(null);
  const [randomTask, setRandomTask] = useState<TaskItem | null>(null);
  const [viewFullTheory, setViewFullTheory] = useState(false);
  
  const { getRandomTheory, getRandomQuestion, getRandomTask, technologies } = useDataStore();
  
  // Load random items on initial render
  useEffect(() => {
    loadRandomItems();
  }, []);
  
  const loadRandomItems = () => {
    setLoading(true);
    
    // Get random items based on filters
    const theoryItem = getRandomTheory(technology === 'all' ? undefined : technology);
    const questionItem = getRandomQuestion(
      technology === 'all' ? undefined : technology,
      difficulty === 'all' ? undefined : difficulty
    );
    const taskItem = getRandomTask(
      technology === 'all' ? undefined : technology,
      difficulty === 'all' ? undefined : difficulty
    );
    
    setRandomTheory(theoryItem);
    setRandomQuestion(questionItem);
    setRandomTask(taskItem);
    setViewFullTheory(false);
    setLoading(false);
  };
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleTechnologyChange = (event: SelectChangeEvent) => {
    setTechnology(event.target.value);
  };
  
  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setDifficulty(event.target.value);
  };
  
  const handleTheoryClick = () => {
    setViewFullTheory(true);
  };
  
  const handleBackToTheory = () => {
    setViewFullTheory(false);
  };
  
  return (
    <Layout>
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            Random Practice
          </Typography>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={loadRandomItems}
          >
            New Random Items
          </Button>
        </Box>
        
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Technology</InputLabel>
              <Select
                value={technology}
                label="Technology"
                onChange={handleTechnologyChange}
              >
                <MenuItem value="all">All Technologies</MenuItem>
                {technologies.map((tech) => (
                  <MenuItem key={tech} value={tech}>{tech}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficulty}
                label="Difficulty"
                onChange={handleDifficultyChange}
              >
                <MenuItem value="all">All Difficulties</MenuItem>
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Filters apply to new random items
              </Typography>
              <Chip 
                label="Strictly Random" 
                color="secondary" 
                size="small" 
                variant="outlined"
              />
            </Box>
          </Box>
        </Paper>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="random content tabs"
            variant="fullWidth"
          >
            <Tab 
              label="Theory" 
              id="random-tab-0" 
              aria-controls="random-tabpanel-0" 
            />
            <Tab 
              label="Question" 
              id="random-tab-1" 
              aria-controls="random-tabpanel-1" 
            />
            <Tab 
              label="Task" 
              id="random-tab-2" 
              aria-controls="random-tabpanel-2" 
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
              {randomTheory ? (
                viewFullTheory ? (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          cursor: 'pointer', 
                          color: 'primary.main',
                          display: 'inline-flex',
                          alignItems: 'center',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={handleBackToTheory}
                      >
                        ← Back to Theory Card
                      </Typography>
                    </Box>
                    <TheoryView theory={randomTheory} />
                  </Box>
                ) : (
                  <TheoryCard 
                    theory={randomTheory} 
                    onClick={handleTheoryClick} 
                  />
                )
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No theory items available for the selected filters.
                </Typography>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              {randomQuestion ? (
                <QuizCard question={randomQuestion} />
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No questions available for the selected filters.
                </Typography>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              {randomTask ? (
                <TaskRunner task={randomTask} />
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  No tasks available for the selected filters.
                </Typography>
              )}
            </TabPanel>
          </>
        )}
      </Box>
    </Layout>
  );
};

export default RandomPage;
