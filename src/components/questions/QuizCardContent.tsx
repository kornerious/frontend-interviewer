import React from 'react';
import { 
  Box, 
  Typography, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  TextField,
  Button
} from '@mui/material';
import { QuestionItem } from '../../../index';

interface QuizCardContentProps {
  question: QuestionItem;
  selectedOption: string;
  userAnswer: string;
  showAnswer: boolean;
  isCorrect: boolean | null;
  aiFeedback: string;
  onOptionChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAnswerChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const QuizCardContent: React.FC<QuizCardContentProps> = ({
  question,
  selectedOption,
  userAnswer,
  showAnswer,
  isCorrect,
  aiFeedback,
  onOptionChange,
  onAnswerChange
}) => {
  switch (question.type) {
    case 'mcq':
      return (
        <Box>
          <Typography variant="body1" gutterBottom>
            {question.question}
          </Typography>
          
          <RadioGroup value={selectedOption} onChange={onOptionChange}>
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
          
          {showAnswer && (
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
              
              <Typography variant="body2" color="white" sx={{ mt: 1 }}>
                Correct answer: {question.options[parseInt(question.answer)]}
              </Typography>
            </Box>
          )}
        </Box>
      );
      
    case 'flashcard':
      return (
        <Box>
          <Typography variant="body1" gutterBottom>
            {question.question}
          </Typography>
          
          {showAnswer && (
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: 'info.dark',
                borderRadius: 1
              }}
            >
              <Typography variant="body1" color="white">
                {question.answer}
              </Typography>
            </Box>
          )}
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
            rows={6}
            variant="outlined"
            placeholder="Type your answer here..."
            value={userAnswer}
            onChange={onAnswerChange}
            disabled={showAnswer}
            sx={{ mt: 2 }}
          />
          
          {showAnswer && (
            <Box sx={{ mt: 2 }}>
              <Box 
                sx={{ 
                  p: 2, 
                  bgcolor: isCorrect ? 'success.dark' : 'error.dark',
                  borderRadius: 1,
                  mb: 2
                }}
              >
                <Typography variant="body1" color="white">
                  {isCorrect ? 'Correct!' : 'Needs Improvement'}
                </Typography>
              </Box>
              
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

export default QuizCardContent;
