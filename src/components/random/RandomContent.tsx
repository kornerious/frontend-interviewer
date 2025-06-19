import React from 'react';
import { 
  Box, 
  Typography,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import TheoryCard from '@/components/theory/TheoryCard';
import TheoryView from '@/components/theory/TheoryView';
import QuizCard from '@/components/questions/QuizCard';
import TaskRunner from '@/components/tasks/TaskRunner';
import { TheoryItem, QuestionItem, TaskItem } from '../../../index';

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

interface RandomContentProps {
  tabValue: number;
  loading: boolean;
  randomTheory: TheoryItem | null;
  randomQuestion: QuestionItem | null;
  randomTask: TaskItem | null;
  viewFullTheory: boolean;
  onTabChange: (event: React.SyntheticEvent, newValue: number) => void;
  onTheoryClick: () => void;
  onBackToTheory: () => void;
}

const RandomContent: React.FC<RandomContentProps> = ({
  tabValue,
  loading,
  randomTheory,
  randomQuestion,
  randomTask,
  viewFullTheory,
  onTabChange,
  onTheoryClick,
  onBackToTheory
}) => {
  return (
    <>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={onTabChange} 
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
                      onClick={onBackToTheory}
                    >
                      ← Back to Theory Card
                    </Typography>
                  </Box>
                  <TheoryView theory={randomTheory} />
                </Box>
              ) : (
                <TheoryCard 
                  theory={randomTheory} 
                  onClick={onTheoryClick} 
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
    </>
  );
};

export default RandomContent;
