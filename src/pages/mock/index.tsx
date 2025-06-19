import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Chip,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useUserStore, useDataStore } from '@/store';
import { getMockExams } from '@/services/firestoreService';
import { generateMockExam } from '@/services/dataService';
import { MockExam } from '../../../index';

const MockExamsPage = () => {
  const router = useRouter();
  const { isAuthenticated, uid } = useUserStore();
  const { technologies } = useDataStore();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mockExams, setMockExams] = useState<MockExam[]>([]);
  const [generatingExam, setGeneratingExam] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  // Load mock exams on initial render
  useEffect(() => {
    if (isAuthenticated && uid) {
      loadMockExams();
    }
  }, [isAuthenticated, uid]);
  
  const loadMockExams = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!uid) {
        throw new Error('User not authenticated');
      }
      
      const exams = await getMockExams(uid);
      setMockExams(exams);
    } catch (err: any) {
      setError(err.message || 'Failed to load mock exams');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateExam = async (technology: string) => {
    setGeneratingExam(true);
    setError('');
    
    try {
      if (!uid) {
        throw new Error('User not authenticated');
      }
      
      const newExam = await generateMockExam(technology);
      
      // Navigate to the exam page
      router.push(`/mock/exam/${newExam.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create mock exam');
      setGeneratingExam(false);
    }
  };
  
  const handleStartExam = (examId: string) => {
    router.push(`/mock/exam/${examId}`);
  };
  
  const handleViewResults = (examId: string) => {
    router.push(`/mock/results/${examId}`);
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
          Test your knowledge with timed mock exams. Each exam contains a mix of questions and coding tasks.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Create New Mock Exam
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Select a technology to create a new mock exam. The exam will contain questions and tasks related to that technology.
          </Typography>
          
          <Grid container spacing={2}>
            {technologies.map((tech) => (
              <Grid item key={tech}>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => handleCreateExam(tech)}
                  disabled={generatingExam}
                >
                  {tech}
                </Button>
              </Grid>
            ))}
            <Grid item>
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleCreateExam('mixed')}
                disabled={generatingExam}
              >
                Mixed Topics
              </Button>
            </Grid>
          </Grid>
          
          {generatingExam && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <CircularProgress size={20} sx={{ mr: 1 }} />
              <Typography variant="body2">
                Generating exam... This may take a moment.
              </Typography>
            </Box>
          )}
        </Paper>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Your Mock Exams
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : mockExams.length === 0 ? (
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            You haven't taken any mock exams yet. Create one above to get started!
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {mockExams.map((exam) => (
              <Grid item xs={12} sm={6} md={4} key={exam.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {exam.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip 
                        label={exam.technology} 
                        color="primary" 
                        size="small" 
                      />
                      <Chip 
                        label={`${exam.duration} min`} 
                        color="secondary" 
                        size="small" 
                      />
                      <Chip 
                        label={exam.completed ? 'Completed' : 'Not Started'} 
                        color={exam.completed ? 'success' : 'default'} 
                        size="small" 
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary">
                      Questions: {exam.questions.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tasks: {exam.tasks.length}
                    </Typography>
                    
                    {exam.completed && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="body2">
                          Score: {exam.score}/{exam.totalPoints} ({Math.round((exam.score / exam.totalPoints) * 100)}%)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed on: {new Date(exam.completedAt).toLocaleDateString()}
                        </Typography>
                      </>
                    )}
                  </CardContent>
                  
                  <CardActions>
                    {exam.completed ? (
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewResults(exam.id)}
                      >
                        View Results
                      </Button>
                    ) : (
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => handleStartExam(exam.id)}
                      >
                        {exam.startedAt ? 'Continue Exam' : 'Start Exam'}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Layout>
  );
};

export default MockExamsPage;
