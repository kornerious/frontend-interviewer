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
import { QuestionItem } from '../../../index';
import { useUserStore, useProgressStore } from '@/store';
import { updateItemProgress, saveSubmission, getItemProgress } from '@/services/firestoreService';
import { reviewCode } from '@/services/aiService';
import QuizCardContent from './QuizCardContent';

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
  const [isIrrelevant, setIsIrrelevant] = useState(false);
  
  // Check if this item is marked as irrelevant in user progress
  useEffect(() => {
    const checkIrrelevantStatus = async () => {
      if (isAuthenticated && uid) {
        try {
          const progress = await getItemProgress(uid, question.id);
          if (progress && progress.status === 'irrelevant') {
            setIsIrrelevant(true);
          }
        } catch (error) {
          console.error('Error fetching irrelevant status:', error);
        }
      }
    };
    
    checkIrrelevantStatus();
  }, [isAuthenticated, uid, question.id]);

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
    const newValue = event.target.checked;
    setIsIrrelevant(newValue);
    
    // Update in Firebase if authenticated
    if (isAuthenticated && uid) {
      try {
        await updateItemProgress(
          uid,
          question.id,
          'question',
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
          <QuizCardContent 
            question={question}
            selectedOption={selectedOption}
            userAnswer={userAnswer}
            showAnswer={showAnswer}
            isCorrect={isCorrect}
            aiFeedback={aiFeedback}
            onOptionChange={handleOptionChange}
            onAnswerChange={handleAnswerChange}
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
              startIcon={isSubmitting ? <CircularProgress size={16} /> : null}
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
