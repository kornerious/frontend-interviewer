import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button, 
  Chip, 
  Box,
  FormControlLabel,
  Checkbox,
  Collapse,
  CircularProgress
} from '@mui/material';
import { TaskItem } from '../../../index';
import { useUserStore, useProgressStore } from '@/store';
import { updateItemProgress, saveSubmission, getItemProgress } from '@/services/firestoreService';
import { reviewCode } from '@/services/aiService';
import TaskContent from './TaskContent';

interface TaskRunnerProps {
  task: TaskItem;
}

const TaskRunner: React.FC<TaskRunnerProps> = ({ task }) => {
  const { isAuthenticated, uid, settings } = useUserStore();
  const { setCompleted, setIncorrect } = useProgressStore();
  
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState(task.startingCode || '');
  const [showHints, setShowHints] = useState(false);
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  // Initialize with false since TaskItem doesn't have irrelevant property
  const [isIrrelevant, setIsIrrelevant] = useState(false);
  
  // Check if this item is marked as irrelevant in user progress
  useEffect(() => {
    const checkIrrelevantStatus = async () => {
      if (isAuthenticated && uid) {
        try {
          const progress = await getItemProgress(uid, task.id);
          if (progress && progress.status === 'irrelevant') {
            setIsIrrelevant(true);
          }
        } catch (error) {
          console.error('Error fetching irrelevant status:', error);
        }
      }
    };
    
    checkIrrelevantStatus();
  }, [isAuthenticated, uid, task.id]);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleShowNextHint = () => {
    if (currentHintIndex < task.hints.length - 1) {
      setCurrentHintIndex(currentHintIndex + 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await reviewCode({
        itemId: task.id,
        type: 'task',
        prompt: task.description,
        userCode: code,
        testCases: task.testCases
      }, settings.aiReviewer);
      
      setAiResponse(response.feedback);
      setIsCorrect(response.isCorrect);
      
      // Update progress in store and Firebase
      if (isAuthenticated && uid) {
        setCompleted(task.id, true);
        if (!response.isCorrect) {
          setIncorrect(task.id, true);
        }
        
        await updateItemProgress(
          uid,
          task.id,
          'task',
          'complete'
        );
        
        await saveSubmission(
          uid,
          task.id,
          code,
          response.isCorrect ? 'pass' : 'fail',
          response.feedback
        );
      }
    } catch (error) {
      console.error('Error submitting code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIrrelevantChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setIsIrrelevant(newValue);
    
    // Update in Firebase if authenticated
    if (isAuthenticated && uid) {
      try {
        await updateItemProgress(
          uid,
          task.id,
          'task',
          newValue ? 'irrelevant' : 'pending'
        );
      } catch (error) {
        console.error('Error updating irrelevant status:', error);
      }
    }
  };

  return (
    <Card 
      sx={{ 
        mb: 2,
        opacity: isIrrelevant ? 0.6 : 1,
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: isIrrelevant ? 'none' : 'translateY(-4px)',
          boxShadow: isIrrelevant ? 'none' : '0 6px 12px rgba(0, 0, 0, 0.3)',
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h2">
            {task.title}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={task.difficulty} 
              color={
                task.difficulty === 'easy' ? 'success' : 
                task.difficulty === 'medium' ? 'warning' : 
                'error'
              }
              size="small"
            />
            <Chip 
              label={`${task.timeEstimate} min`} 
              color="info" 
              size="small"
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {task.tags.map((tag) => (
            <Chip 
              key={tag} 
              label={tag} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          ))}
        </Box>
        
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <TaskContent
            description={task.description}
            code={code}
            hints={task.hints}
            showHints={showHints}
            currentHintIndex={currentHintIndex}
            aiResponse={aiResponse}
            isCorrect={isCorrect}
            onCodeChange={handleCodeChange}
            onShowHintsToggle={() => setShowHints(!showHints)}
            onNextHint={handleShowNextHint}
          />
        </Collapse>
      </CardContent>
      
      <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Box>
          <Button 
            size="small" 
            color="primary" 
            onClick={handleExpandClick}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
          
          {expanded && (
            <Button 
              size="small" 
              color="secondary" 
              onClick={handleSubmit}
              disabled={isSubmitting || !code.trim()}
              startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
            >
              {isSubmitting ? 'Submitting...' : 'Submit for AI Review'}
            </Button>
          )}
        </Box>
        
        <FormControlLabel
          control={
            <Checkbox 
              checked={isIrrelevant}
              onChange={handleIrrelevantChange}
              size="small"
            />
          }
          label="Irrelevant"
        />
      </CardActions>
    </Card>
  );
};

export default TaskRunner;
