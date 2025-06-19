import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import Layout from '@/components/layout/Layout';
import RandomFilters from '@/components/random/RandomFilters';
import RandomContent from '@/components/random/RandomContent';
import { useDataStore } from '@/store';
import { TheoryItem, QuestionItem, TaskItem } from '../../index';
import { SelectChangeEvent } from '@mui/material';



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
        
        <RandomFilters
          technology={technology}
          difficulty={difficulty}
          technologies={technologies}
          onTechnologyChange={handleTechnologyChange}
          onDifficultyChange={handleDifficultyChange}
        />
        
        <RandomContent
          tabValue={tabValue}
          loading={loading}
          randomTheory={randomTheory}
          randomQuestion={randomQuestion}
          randomTask={randomTask}
          viewFullTheory={viewFullTheory}
          onTabChange={handleTabChange}
          onTheoryClick={handleTheoryClick}
          onBackToTheory={handleBackToTheory}
        />
      </Box>
    </Layout>
  );
};

export default RandomPage;
