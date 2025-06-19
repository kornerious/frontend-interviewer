import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Chip,
  CircularProgress,
  Divider
} from '@mui/material';
import { useRouter } from 'next/router';
import { useUserStore, useDataStore, useProgressStore } from '@/store';
import Link from 'next/link';

const HomePage = () => {
  const router = useRouter();
  const { isAuthenticated, uid } = useUserStore();
  const { modules, technologies, learningPaths, loadData } = useDataStore();
  const { completedItems, incorrectItems } = useProgressStore();
  
  const [loading, setLoading] = useState(true);
  const [recentModules, setRecentModules] = useState<any[]>([]);
  const [recommendedModules, setRecommendedModules] = useState<any[]>([]);
  
  // Load data on initial render
  useEffect(() => {
    const initializeData = async () => {
      try {
        await loadData();
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };
    
    initializeData();
  }, [loadData]);
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!modules || modules.length === 0) return 0;
    
    const totalItems = modules.reduce((acc, module) => {
      const theoryCount = module.theory?.length || 0;
      const questionsCount = module.questions?.length || 0;
      const tasksCount = module.tasks?.length || 0;
      return acc + theoryCount + questionsCount + tasksCount;
    }, 0);
    
    if (totalItems === 0) return 0;
    
    const completed = Object.keys(completedItems).length;
    return Math.round((completed / totalItems) * 100);
  };
  
  return (
    <Box sx={{ py: 4 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Welcome Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome to Frontend Interviewer
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Master frontend development concepts through structured learning paths, interactive quizzes, and coding tasks.
            </Typography>
          </Box>
          
          {/* Progress Section (Only for authenticated users) */}
          {isAuthenticated && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Your Progress
              </Typography>
              
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="primary">
                      {calculateProgress()}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overall Completion
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="success.main">
                      {Object.keys(completedItems).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Items Completed
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" color="error">
                      {Object.keys(incorrectItems).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Items to Review
                    </Typography>
                    
                    {Object.keys(incorrectItems).length > 0 && (
                      <Button 
                        variant="outlined" 
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                        onClick={() => router.push('/review/incorrect')}
                      >
                        Review Now
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
          
          {/* Main Features */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" gutterBottom>
                {isAuthenticated ? 'Recommended for You' : 'Get Started'}
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {/* Learning Paths Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Learning Paths
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Structured curriculum from beginner to expert. Master frontend concepts step by step.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => {
                        if (modules.length > 0) {
                          router.push(`/modules/${modules[0].id}`);
                        }
                      }}
                    >
                      Start Learning
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              {/* Random Practice Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Random Practice
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Test your knowledge with random questions and tasks from all topics.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => router.push('/random')}
                    >
                      Try Random Item
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              {/* Mock Exams Card */}
              <Grid item xs={12} sm={6} md={4}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      Mock Exams
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Simulate real interview conditions with timed exams and AI-powered feedback.
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      size="small" 
                      color="primary"
                      onClick={() => router.push('/mock')}
                    >
                      Take Mock Exam
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
              
              {/* Review Incorrect Items Card (Only for authenticated users with incorrect items) */}
              {isAuthenticated && Object.keys(incorrectItems).length > 0 && (
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        Review Incorrect Items
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Focus on your weak areas by reviewing items you've previously answered incorrectly.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => router.push('/review/incorrect')}
                      >
                        Review Now
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Box>
        </>
      )}
    </Box>
  );
};

export default HomePage;
