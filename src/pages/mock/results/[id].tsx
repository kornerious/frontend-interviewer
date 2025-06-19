import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Divider, 
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useUserStore } from '@/store';
import { getMockExam } from '@/services/firestoreService';
import { MockExam, QuestionItem, TaskItem } from '../../../../index';

const ExamResultsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, uid } = useUserStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exam, setExam] = useState<MockExam | null>(null);
  
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
      
      // If exam is not completed, redirect to exam page
      if (!examData.completed) {
        router.push(`/mock/exam/${examId}`);
        return;
      }
      
      setExam(examData);
    } catch (err: any) {
      setError(err.message || 'Failed to load exam results');
    } finally {
      setLoading(false);
    }
  };
  
  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };
  
  const getLetterGrade = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
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
            Exam results not found
          </Typography>
          <Button variant="contained" onClick={() => router.push('/mock')}>
            Back to Mock Exams
          </Button>
        </Box>
      </Layout>
    );
  }
  
  const scoreColor = getScoreColor(exam.score, exam.totalPoints);
  const letterGrade = getLetterGrade(exam.score, exam.totalPoints);
  const scorePercentage = Math.round((exam.score / exam.totalPoints) * 100);
  
  return (
    <Layout>
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {exam.title} Results
          </Typography>
          
          <Button 
            variant="outlined" 
            onClick={() => router.push('/mock')}
          >
            Back to Mock Exams
          </Button>
        </Box>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Final Score
                </Typography>
                <Typography 
                  variant="h2" 
                  color={`${scoreColor}.main`}
                  sx={{ fontWeight: 'bold' }}
                >
                  {scorePercentage}%
                </Typography>
                <Typography variant="h4" color={`${scoreColor}.main`}>
                  {exam.score}/{exam.totalPoints} points
                </Typography>
                <Chip 
                  label={`Grade: ${letterGrade}`} 
                  color={scoreColor}
                  sx={{ mt: 1, fontSize: '1.2rem', fontWeight: 'bold', height: 32 }}
                />
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Technology:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {exam.technology}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Duration:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {exam.duration} minutes
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Completed On:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {new Date(exam.completedAt).toLocaleDateString()} at {new Date(exam.completedAt).toLocaleTimeString()}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Items:
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {exam.questions.length} Questions, {exam.tasks.length} Tasks
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        <Typography variant="h5" gutterBottom>
          Detailed Results
        </Typography>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Questions
          </Typography>
          
          {exam.questions.map((question: QuestionItem & { correct?: boolean, userAnswer?: string, feedback?: string }, index) => (
            <Accordion key={question.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Typography>
                    Question {index + 1}: {question.topic}
                  </Typography>
                  <Chip 
                    label={question.correct ? 'Correct' : 'Incorrect'} 
                    color={question.correct ? 'success' : 'error'}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {question.question}
                  </Typography>
                  
                  {question.type === 'mcq' && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Options:
                      </Typography>
                      <Box sx={{ pl: 2 }}>
                        {question.options.map((option, i) => (
                          <Typography 
                            key={i} 
                            variant="body1"
                            sx={{ 
                              color: option === question.correctAnswer ? 'success.main' : 
                                    option === question.userAnswer && option !== question.correctAnswer ? 'error.main' : 
                                    'text.primary',
                              fontWeight: option === question.correctAnswer || option === question.userAnswer ? 'bold' : 'normal'
                            }}
                          >
                            {String.fromCharCode(65 + i)}. {option}
                            {option === question.correctAnswer && ' ✓'}
                            {option === question.userAnswer && option !== question.correctAnswer && ' ✗'}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}
                  
                  {question.type === 'open' && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Your Answer:
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.paper' }}>
                        <Typography variant="body1">
                          {question.userAnswer || 'No answer provided'}
                        </Typography>
                      </Paper>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Correct Answer:
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: 'background.paper' }}>
                        <Typography variant="body1">
                          {question.correctAnswer}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                  
                  {question.feedback && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        AI Feedback:
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          mt: 1, 
                          bgcolor: 'background.paper',
                          borderColor: question.correct ? 'success.main' : 'error.main'
                        }}
                      >
                        <Typography variant="body2">
                          {question.feedback}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
        
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Tasks
          </Typography>
          
          {exam.tasks.map((task: TaskItem & { correct?: boolean, userCode?: string, feedback?: string }, index) => (
            <Accordion key={task.id} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <Typography>
                    Task {index + 1}: {task.title}
                  </Typography>
                  <Chip 
                    label={task.correct ? 'Correct' : 'Incorrect'} 
                    color={task.correct ? 'success' : 'error'}
                    size="small"
                    sx={{ ml: 2 }}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {task.description}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Your Solution:
                    </Typography>
                    <Paper 
                      variant="outlined" 
                      sx={{ 
                        p: 2, 
                        mt: 1, 
                        bgcolor: 'background.paper',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      <Typography variant="body2" component="pre" sx={{ fontFamily: 'monospace' }}>
                        {task.userCode || 'No solution provided'}
                      </Typography>
                    </Paper>
                  </Box>
                  
                  {task.feedback && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        AI Feedback:
                      </Typography>
                      <Paper 
                        variant="outlined" 
                        sx={{ 
                          p: 2, 
                          mt: 1, 
                          bgcolor: 'background.paper',
                          borderColor: task.correct ? 'success.main' : 'error.main'
                        }}
                      >
                        <Typography variant="body2">
                          {task.feedback}
                        </Typography>
                      </Paper>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => router.push('/mock')}
            size="large"
          >
            Back to Mock Exams
          </Button>
        </Box>
      </Box>
    </Layout>
  );
};

export default ExamResultsPage;
