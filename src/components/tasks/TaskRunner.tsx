import React, { useState } from 'react';
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
  CircularProgress,
  Divider
} from '@mui/material';
import Editor from '@monaco-editor/react';
import { TaskItem } from '../../../index';
import { useUserStore, useProgressStore } from '@/store';
import { updateItemProgress, saveSubmission } from '@/services/firestoreService';
import { reviewCode } from '@/services/aiService';

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
  const [isIrrelevant, setIsIrrelevant] = useState(task.irrelevant || false);

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
    setIsIrrelevant(event.target.checked);
    // Update in Firebase if authenticated
    if (isAuthenticated && uid) {
      // This would require updating the task in the database
      // For now, we'll just track it in the local state
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
          <Box sx={{ mb: 3 }}>
            {/* Render markdown description as HTML */}
            <div 
              dangerouslySetInnerHTML={{ 
                __html: task.description
                  .replace(/\n/g, '<br />')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
              }} 
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Code Editor
            </Typography>
            <Editor
              height="300px"
              defaultLanguage="javascript"
              value={code}
              onChange={handleCodeChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                tabSize: 2
              }}
            />
          </Box>
          
          {task.hints.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Button 
                variant="outlined" 
                color="info" 
                size="small" 
                onClick={() => setShowHints(!showHints)}
              >
                {showHints ? 'Hide Hints' : 'Show Hints'}
              </Button>
              
              <Collapse in={showHints} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Hint {currentHintIndex + 1} of {task.hints.length}:
                  </Typography>
                  <Typography variant="body2">
                    {task.hints[currentHintIndex]}
                  </Typography>
                  
                  {currentHintIndex < task.hints.length - 1 && (
                    <Button 
                      size="small" 
                      color="primary" 
                      onClick={handleShowNextHint}
                      sx={{ mt: 1 }}
                    >
                      Next Hint
                    </Button>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}
          
          {aiResponse && (
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                AI Review Result: {isCorrect ? '✅ Correct' : '❌ Needs Improvement'}
              </Typography>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  border: 1,
                  borderColor: isCorrect ? 'success.main' : 'error.main'
                }}
              >
                <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                  {aiResponse}
                </Typography>
              </Box>
            </Box>
          )}
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
