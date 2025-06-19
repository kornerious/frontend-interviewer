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
  Radio,
  RadioGroup,
  FormControl,
  TextField,
  Collapse
} from '@mui/material';
import { QuestionItem } from '../../../index';
import { useUserStore, useProgressStore } from '@/store';
import { updateItemProgress, saveSubmission } from '@/services/firestoreService';
import { reviewCode } from '@/services/aiService';

interface QuizCardProps {
  question: QuestionItem;
}

const QuizCard: React.FC<QuizCardProps> = ({ question }) => {
  const { isAuthenticated, uid, settings } = useUserStore();
  const { setCompleted, setIncorrect } = useProgressStore();
  
  const [expanded, setExpanded] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIrrelevant, setIsIrrelevant] = useState(question.irrelevant || false);

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(event.target.value);
  };

  const handleSubmit = async () => {
    const answer = question.type === 'mcq' ? selectedOption : userAnswer;
    
    // Check if answer is correct
    let correct = false;
    if (question.type === 'mcq') {
      const correctOptionIndex = parseInt(question.answer);
      correct = question.options[correctOptionIndex] === selectedOption;
    } else {
      // For open-ended questions, we'll use AI to evaluate
      setIsSubmitting(true);
      
      try {
        const aiResponse = await reviewCode({
          itemId: question.id,
          type: 'question',
          prompt: question.question,
          userCode: userAnswer
        }, settings.aiReviewer);
        
        correct = aiResponse.isCorrect;
        setAiFeedback(aiResponse.feedback);
        
        // Save submission to Firebase if authenticated
        if (isAuthenticated && uid) {
          await saveSubmission(
            uid,
            question.id,
            userAnswer,
            correct ? 'pass' : 'fail',
            aiResponse.feedback
          );
        }
      } catch (error) {
        console.error('Error submitting answer:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
    
    setIsCorrect(correct);
    setShowAnswer(true);
    
    // Update progress in store and Firebase
    if (isAuthenticated && uid) {
      setCompleted(question.id, true);
      if (!correct) {
        setIncorrect(question.id, true);
      }
      
      await updateItemProgress(
        uid,
        question.id,
        'question',
        'complete'
      );
    }
  };

  const handleIrrelevantChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsIrrelevant(event.target.checked);
    // Update in Firebase if authenticated
    if (isAuthenticated && uid) {
      // This would require updating the question in the database
      // For now, we'll just track it in the local state
    }
  };

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'mcq':
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              {question.question}
            </Typography>
            
            <FormControl component="fieldset" sx={{ mt: 2 }}>
              <RadioGroup value={selectedOption} onChange={handleOptionChange}>
                {question.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio />}
                    label={option}
                    disabled={showAnswer}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        );
        
      case 'flashcard':
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              {question.question}
            </Typography>
            
            <Collapse in={showAnswer}>
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="body1">
                  {question.answer}
                </Typography>
              </Box>
            </Collapse>
          </Box>
        );
        
      case 'open':
      case 'code':
        return (
          <Box>
            <Typography variant="body1" gutterBottom>
              {question.question}
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Type your answer here..."
              value={userAnswer}
              onChange={handleAnswerChange}
              disabled={showAnswer}
              sx={{ mt: 2 }}
            />
            
            {showAnswer && aiFeedback && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  AI Feedback:
                </Typography>
                <Typography variant="body2">
                  {aiFeedback}
                </Typography>
              </Box>
            )}
          </Box>
        );
        
      default:
        return null;
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
            {question.topic}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip 
              label={question.level} 
              color={
                question.level === 'easy' ? 'success' : 
                question.level === 'medium' ? 'warning' : 
                'error'
              }
              size="small"
            />
            <Chip 
              label={question.type} 
              color="secondary" 
              size="small"
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {question.tags.map((tag) => (
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
          {renderQuestionContent()}
          
          {showAnswer && isCorrect !== null && (
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: isCorrect ? 'success.dark' : 'error.dark',
                borderRadius: 1
              }}
            >
              <Typography variant="body1" color="white">
                {isCorrect ? 'Correct!' : 'Incorrect!'}
              </Typography>
              
              {question.type === 'mcq' && (
                <Typography variant="body2" color="white" sx={{ mt: 1 }}>
                  Correct answer: {question.options[parseInt(question.answer)]}
                </Typography>
              )}
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
          
          {expanded && !showAnswer && (
            <Button 
              size="small" 
              color="secondary" 
              onClick={handleSubmit}
              disabled={
                isSubmitting || 
                (question.type === 'mcq' && !selectedOption) ||
                ((question.type === 'open' || question.type === 'code') && !userAnswer)
              }
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          )}
          
          {expanded && question.type === 'flashcard' && !showAnswer && (
            <Button 
              size="small" 
              color="info" 
              onClick={() => setShowAnswer(true)}
            >
              Show Answer
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

export default QuizCard;
