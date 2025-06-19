import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Slider,
  Chip,
  FormGroup,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useUserStore, useDataStore } from '@/store';
import { Technology } from '../../index';

// Mock exam configuration interface
interface ExamConfig {
  topics: string[];
  mcqCount: number;
  openEndedCount: number;
  codingCount: number;
  timeLimit: number; // in minutes
}

// Mock exam state
interface ExamState {
  isActive: boolean;
  currentStep: number;
  startTime: number;
  endTime: number;
  questions: any[];
  answers: Record<string, any>;
  markedForReview: string[];
}

const MockExamPage = () => {
  const router = useRouter();
  const { isAuthenticated, uid } = useUserStore();
  const { technologies } = useDataStore();
  
  // Configuration state
  const [config, setConfig] = useState<ExamConfig>({
    topics: [],
    mcqCount: 5,
    openEndedCount: 2,
    codingCount: 1,
    timeLimit: 30
  });
  
  // Exam state
  const [examState, setExamState] = useState<ExamState>({
    isActive: false,
    currentStep: 0,
    startTime: 0,
    endTime: 0,
    questions: [],
    answers: {},
    markedForReview: []
  });
  
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  // Timer effect for active exams
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (examState.isActive) {
      timer = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, examState.endTime - now);
        
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          clearInterval(timer);
          handleSubmitExam();
        }
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [examState.isActive, examState.endTime]);
  
  const handleTopicChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setConfig({
      ...config,
      topics: typeof value === 'string' ? value.split(',') : value,
    });
  };
  
  const handleMCQCountChange = (_event: Event, value: number | number[]) => {
    setConfig({
      ...config,
      mcqCount: value as number
    });
  };
  
  const handleOpenEndedCountChange = (_event: Event, value: number | number[]) => {
    setConfig({
      ...config,
      openEndedCount: value as number
    });
  };
  
  const handleCodingCountChange = (_event: Event, value: number | number[]) => {
    setConfig({
      ...config,
      codingCount: value as number
    });
  };
  
  const handleTimeLimitChange = (_event: Event, value: number | number[]) => {
    setConfig({
      ...config,
      timeLimit: value as number
    });
  };
  
  const startExam = async () => {
    setLoading(true);
    
    try {
      // In a real implementation, we would fetch questions based on config
      // For now, we'll just simulate this with a timeout
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock questions (in a real app, these would come from the database)
      const mockQuestions = [
        { id: 'q1', type: 'mcq', question: 'Sample MCQ question?', options: ['A', 'B', 'C', 'D'] },
        { id: 'q2', type: 'open', question: 'Sample open-ended question?' },
        { id: 'q3', type: 'code', question: 'Sample coding task?', startingCode: '// Write your code here' }
      ];
      
      const now = Date.now();
      const endTime = now + (config.timeLimit * 60 * 1000);
      
      setExamState({
        isActive: true,
        currentStep: 0,
        startTime: now,
        endTime: endTime,
        questions: mockQuestions,
        answers: {},
        markedForReview: []
      });
      
      setTimeRemaining(config.timeLimit * 60 * 1000);
    } catch (error) {
      console.error('Error starting exam:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNextQuestion = () => {
    if (examState.currentStep < examState.questions.length - 1) {
      setExamState({
        ...examState,
        currentStep: examState.currentStep + 1
      });
    }
  };
  
  const handlePreviousQuestion = () => {
    if (examState.currentStep > 0) {
      setExamState({
        ...examState,
        currentStep: examState.currentStep - 1
      });
    }
  };
  
  const handleMarkForReview = () => {
    const questionId = examState.questions[examState.currentStep].id;
    const isMarked = examState.markedForReview.includes(questionId);
    
    setExamState({
      ...examState,
      markedForReview: isMarked
        ? examState.markedForReview.filter(id => id !== questionId)
        : [...examState.markedForReview, questionId]
    });
  };
  
  const handleSubmitExam = () => {
    // In a real implementation, we would submit the exam and show results
    setExamState({
      ...examState,
      isActive: false
    });
    
    // TODO: Submit to Firebase and get AI feedback
  };
  
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Render exam configuration
  const renderExamConfig = () => {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Configure Your Mock Exam
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="topics-label">Topics</InputLabel>
              <Select
                labelId="topics-label"
                multiple
                value={config.topics}
                onChange={handleTopicChange}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {technologies.map((tech) => (
                  <MenuItem key={tech} value={tech}>
                    {tech}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Multiple Choice Questions: {config.mcqCount}
              </Typography>
              <Slider
                value={config.mcqCount}
                onChange={handleMCQCountChange}
                min={0}
                max={20}
                marks={[
                  { value: 0, label: '0' },
                  { value: 10, label: '10' },
                  { value: 20, label: '20' }
                ]}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Open-ended Questions: {config.openEndedCount}
              </Typography>
              <Slider
                value={config.openEndedCount}
                onChange={handleOpenEndedCountChange}
                min={0}
                max={10}
                marks={[
                  { value: 0, label: '0' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' }
                ]}
              />
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Coding Tasks: {config.codingCount}
              </Typography>
              <Slider
                value={config.codingCount}
                onChange={handleCodingCountChange}
                min={0}
                max={5}
                marks={[
                  { value: 0, label: '0' },
                  { value: 2, label: '2' },
                  { value: 5, label: '5' }
                ]}
              />
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography gutterBottom>
                Time Limit: {config.timeLimit} minutes
              </Typography>
              <Slider
                value={config.timeLimit}
                onChange={handleTimeLimitChange}
                min={15}
                max={120}
                step={15}
                marks={[
                  { value: 15, label: '15m' },
                  { value: 60, label: '1h' },
                  { value: 120, label: '2h' }
                ]}
              />
            </Box>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={startExam}
                disabled={loading || config.topics.length === 0 || 
                  (config.mcqCount + config.openEndedCount + config.codingCount === 0)}
              >
                {loading ? <CircularProgress size={24} /> : 'Start Exam'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };
  
  // Render active exam
  const renderActiveExam = () => {
    const currentQuestion = examState.questions[examState.currentStep];
    const isMarkedForReview = examState.markedForReview.includes(currentQuestion.id);
    
    return (
      <Box>
        <Paper sx={{ p: 2, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Question {examState.currentStep + 1} of {examState.questions.length}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {isMarkedForReview && (
              <Chip label="Marked for Review" color="warning" size="small" />
            )}
            
            <Typography variant="h6" sx={{ 
              color: timeRemaining < 60000 ? 'error.main' : 'inherit',
              animation: timeRemaining < 60000 ? 'pulse 1s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 },
              }
            }}>
              Time: {formatTime(timeRemaining)}
            </Typography>
          </Box>
        </Paper>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          {/* In a real implementation, we would render different question types */}
          <Typography variant="h6" gutterBottom>
            {currentQuestion.question}
          </Typography>
          
          {currentQuestion.type === 'mcq' && (
            <FormGroup>
              {currentQuestion.options.map((option: string, index: number) => (
                <FormControlLabel
                  key={index}
                  control={<Checkbox />}
                  label={option}
                />
              ))}
            </FormGroup>
          )}
          
          {currentQuestion.type === 'open' && (
            <Typography color="text.secondary">
              [Open-ended question input would go here]
            </Typography>
          )}
          
          {currentQuestion.type === 'code' && (
            <Typography color="text.secondary">
              [Code editor would go here]
            </Typography>
          )}
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={handlePreviousQuestion}
            disabled={examState.currentStep === 0}
          >
            Previous
          </Button>
          
          <Box>
            <Button
              variant="outlined"
              color="warning"
              onClick={handleMarkForReview}
              sx={{ mr: 1 }}
            >
              {isMarkedForReview ? 'Unmark for Review' : 'Mark for Review'}
            </Button>
            
            <Button
              variant="contained"
              color="error"
              onClick={handleSubmitExam}
            >
              Submit Exam
            </Button>
          </Box>
          
          <Button
            variant="outlined"
            onClick={handleNextQuestion}
            disabled={examState.currentStep === examState.questions.length - 1}
          >
            Next
          </Button>
        </Box>
      </Box>
    );
  };
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <Layout>
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Mock Exams
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Test your knowledge with timed mock exams and receive AI feedback on your performance.
        </Typography>
        
        {examState.isActive ? renderActiveExam() : renderExamConfig()}
      </Box>
    </Layout>
  );
};

export default MockExamPage;
