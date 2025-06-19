import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Stepper, 
  Step, 
  StepLabel,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  LinearProgress
} from '@mui/material';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import QuizCard from '@/components/questions/QuizCard';
import TaskRunner from '@/components/tasks/TaskRunner';
import { useUserStore } from '@/store';
import { getMockExam, updateMockExam, submitMockExam } from '@/services/firestoreService';
import { MockExam, QuestionItem, TaskItem } from '../../../../index';

const ExamPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, uid } = useUserStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exam, setExam] = useState<MockExam | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  // Load exam data
  useEffect(() => {
    if (isAuthenticated && uid && id && typeof id === 'string') {
      loadExam(id);
    }
  }, [isAuthenticated, uid, id]);
  
  // Timer effect
  useEffect(() => {
    if (!exam || exam.completed) return;
    
    // Calculate time remaining
    const startTime = exam.startedAt ? new Date(exam.startedAt).getTime() : Date.now();
    const endTime = startTime + (exam.duration * 60 * 1000);
    const remaining = Math.max(0, endTime - Date.now());
    setTimeRemaining(remaining);
    
    // Update exam start time if not set
    if (!exam.startedAt) {
      updateExamStartTime();
    }
    
    // Set up timer
    const timer = setInterval(() => {
      const newRemaining = Math.max(0, endTime - Date.now());
      setTimeRemaining(newRemaining);
      
      // Auto-submit when time runs out
      if (newRemaining === 0) {
        handleSubmitExam();
        clearInterval(timer);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [exam]);
  
  const loadExam = async (examId: string) => {
    setLoading(true);
    setError('');
    
    try {
      if (!uid) {
        throw new Error('User not authenticated');
      }
      
      const examData = await getMockExam(uid, examId);
      
      if (!examData) {
        throw new Error('Exam not found');
      }
      
      // If exam is completed, redirect to results page
      if (examData.completed) {
        router.push(`/mock/results/${examId}`);
        return;
      }
      
      setExam(examData);
      
      // Set active step based on progress
      if (examData.currentItemIndex !== undefined) {
        setActiveStep(examData.currentItemIndex);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load exam');
    } finally {
      setLoading(false);
    }
  };
  
  const updateExamStartTime = async () => {
    try {
      if (!uid || !id || !exam) return;
      
      const updatedExam = {
        ...exam,
        startedAt: new Date().toISOString()
      };
      
      await updateMockExam(uid, updatedExam);
      setExam(updatedExam);
    } catch (err) {
      console.error('Failed to update exam start time:', err);
    }
  };
  
  const updateExamProgress = async (index: number) => {
    try {
      if (!uid || !id || !exam) return;
      
      const updatedExam = {
        ...exam,
        currentItemIndex: index
      };
      
      await updateMockExam(uid, updatedExam);
      setExam(updatedExam);
    } catch (err) {
      console.error('Failed to update exam progress:', err);
    }
  };
  
  const handleNext = () => {
    const nextStep = activeStep + 1;
    setActiveStep(nextStep);
    updateExamProgress(nextStep);
  };
  
  const handleBack = () => {
    const prevStep = activeStep - 1;
    setActiveStep(prevStep);
    updateExamProgress(prevStep);
  };
  
  const handleSubmitExam = async () => {
    setSubmitting(true);
    setConfirmSubmit(false);
    
    try {
      if (!uid || !id || !exam) {
        throw new Error('Missing required data');
      }
      
      await submitMockExam(uid, exam.id);
      router.push(`/mock/results/${exam.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  };
  
  const handleConfirmSubmit = () => {
    setConfirmSubmit(true);
  };
  
  const handleCancelSubmit = () => {
    setConfirmSubmit(false);
  };
  
  const handleExitExam = () => {
    setConfirmExit(true);
  };
  
  const handleConfirmExit = () => {
    router.push('/mock');
  };
  
  const handleCancelExit = () => {
    setConfirmExit(false);
  };
  
  // Format time remaining as MM:SS
  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60000);
    const seconds = Math.floor((timeRemaining % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // Get current item (question or task)
  const getCurrentItem = () => {
    if (!exam) return null;
    
    const allItems = [...exam.questions, ...exam.tasks];
    return allItems[activeStep] || null;
  };
  
  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (!exam) return 0;
    
    const totalItems = exam.questions.length + exam.tasks.length;
    return (activeStep / totalItems) * 100;
  };
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <Box sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={() => router.push('/mock')}>
            Back to Mock Exams
          </Button>
        </Box>
      </Layout>
    );
  }
  
  if (!exam) {
    return (
      <Layout>
        <Box sx={{ py: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Exam not found
          </Typography>
          <Button variant="contained" onClick={() => router.push('/mock')}>
            Back to Mock Exams
          </Button>
        </Box>
      </Layout>
    );
  }
  
  const currentItem = getCurrentItem();
  const totalItems = exam.questions.length + exam.tasks.length;
  
  return (
    <Layout>
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {exam.title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Paper sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                Time Remaining:
              </Typography>
              <Typography 
                variant="h6" 
                color={timeRemaining < 300000 ? 'error' : 'inherit'}
                sx={{ fontFamily: 'monospace' }}
              >
                {formatTimeRemaining()}
              </Typography>
            </Paper>
            
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleExitExam}
            >
              Exit
            </Button>
          </Box>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={getProgressPercentage()} 
          sx={{ mb: 3, height: 8, borderRadius: 4 }}
        />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Question {activeStep + 1} of {totalItems}
          </Typography>
        </Box>
        
        <Paper sx={{ p: 3, mb: 3 }}>
          {currentItem && (
            currentItem.type === 'question' ? (
              <QuizCard question={currentItem as QuestionItem} />
            ) : (
              <TaskRunner task={currentItem as TaskItem} />
            )
          )}
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0}
          >
            Previous
          </Button>
          
          <Box>
            {activeStep === totalItems - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmSubmit}
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : 'Submit Exam'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Box>
      
      {/* Confirm Submit Dialog */}
      <Dialog
        open={confirmSubmit}
        onClose={handleCancelSubmit}
      >
        <DialogTitle>Submit Exam?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to submit your exam? You won't be able to make any changes after submission.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSubmit}>Cancel</Button>
          <Button onClick={handleSubmitExam} color="primary" autoFocus>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm Exit Dialog */}
      <Dialog
        open={confirmExit}
        onClose={handleCancelExit}
      >
        <DialogTitle>Exit Exam?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to exit the exam? Your progress will be saved, but the timer will continue running.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelExit}>Cancel</Button>
          <Button onClick={handleConfirmExit} color="primary" autoFocus>
            Exit
          </Button>
        </DialogActions>
      </Dialog>
    </Layout>
  );
};

export default ExamPage;
