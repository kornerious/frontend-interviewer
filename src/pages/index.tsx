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
import Layout from '@/components/layout/Layout';
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
    const initData = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    
    initData();
  }, []);
  
  // Set recent and recommended modules when data is loaded
  useEffect(() => {
    if (modules.length > 0) {
      // Get recent modules (last 3)
      const recent = modules.slice(0, 3);
      setRecentModules(recent);
      
      // Get recommended modules based on user progress
      const recommended = getRecommendedModules();
      setRecommendedModules(recommended);
    }
  }, [modules, completedItems, incorrectItems]);
  
  // Get recommended modules based on user progress
  const getRecommendedModules = () => {
    // If no progress data, return first modules from each learning path
    if (Object.keys(completedItems).length === 0) {
      const firstModules: any[] = [];
      learningPaths.forEach(path => {
        const pathModules = modules.filter(m => m.learningPath === path);
        if (pathModules.length > 0) {
          firstModules.push(pathModules[0]);
        }
      });
      return firstModules.slice(0, 3);
    }
    
    // Otherwise, find modules with prerequisites completed but not the module itself
    const recommended = modules.filter(module => {
      // Skip if module is completed
      if (module.id in completedItems) return false;
      
      // Check if all prerequisites are completed
      const prereqsCompleted = module.prerequisites.every(prereq => prereq in completedItems);
      return prereqsCompleted;
    });
    
    return recommended.slice(0, 3);
  };
  
  // Calculate overall progress
  const calculateProgress = () => {
    if (modules.length === 0) return 0;
    
    const totalItems = modules.reduce((total, module) => {
      return total + module.theory.length + module.questions.length + module.tasks.length;
    }, 0);
    
    const completed = Object.keys(completedItems).length;
    return Math.round((completed / totalItems) * 100);
  };
  
  return (
    <Layout>
      <Box sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {isAuthenticated ? 'Welcome back to Frontend Interviewer' : 'Frontend Interviewer'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Your self-paced, AI-assisted frontend interview preparation platform.
              </Typography>
            </Box>
            
            {isAuthenticated && (
              <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Your Progress
                </Typography>
                
                <Grid container spacing={3}>
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
                      <Typography variant="h3" color="primary">
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
            
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" gutterBottom>
                  {isAuthenticated ? 'Recommended for You' : 'Get Started'}
                </Typography>
                
                <Button 
                  variant="text" 
                  color="primary"
                  onClick={() => router.push('/modules')}
                >
                  View All Modules
                </Button>
              </Box>
              
              <Grid container spacing={3}>
                {recommendedModules.map((module) => (
                  <Grid item xs={12} sm={6} md={4} key={module.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {module.title}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          <Chip 
                            label={module.technology} 
                            color="primary" 
                            size="small" 
                          />
                          <Chip 
                            label={module.learningPath} 
                            color="secondary" 
                            size="small" 
                          />
                          <Chip 
                            label={`Complexity: ${module.complexity}`} 
                            color="info" 
                            size="small" 
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          {module.description}
                        </Typography>
                        
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            {module.theory.length} Theory Items
                          </Typography>
                          <Typography variant="body2">
                            {module.questions.length} Questions
                          </Typography>
                          <Typography variant="body2">
                            {module.tasks.length} Coding Tasks
                          </Typography>
                        </Box>
                      </CardContent>
                      
                      <CardActions>
                        <Button 
                          size="small" 
                          color="primary"
                          onClick={() => router.push(`/modules/${module.path}`)}
                        >
                          Start Learning
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" gutterBottom>
                Special Features
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        Random Practice
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Test your knowledge with random theory, questions, and tasks from across all topics.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        color="primary"
                        onClick={() => router.push('/random')}
                      >
                        Try Random Items
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        Mock Exams
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Take timed mock interviews with a mix of questions and coding tasks. Get AI feedback on your performance.
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
      
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            {isAuthenticated ? 'Recommended for You' : 'Get Started'}
          </Typography>
          
          <Button 
            variant="text" 
            color="primary"
            onClick={() => router.push('/modules')}
          >
            View All Modules
          </Button>
        </Box>
        
        <Grid container spacing={3}>
          {recommendedModules.map((module) => (
            <Grid item xs={12} sm={6} md={4} key={module.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {module.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip 
                      label={module.technology} 
                      color="primary" 
                      size="small" 
                    />
                    <Chip 
                      label={module.learningPath} 
                      color="secondary" 
                      size="small" 
                    />
                    <Chip 
                      label={`Complexity: ${module.complexity}`} 
                      color="info" 
                      size="small" 
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary">
                    {module.description}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      {module.theory.length} Theory Items
                    </Typography>
                    <Typography variant="body2">
                      {module.questions.length} Questions
                    </Typography>
                    <Typography variant="body2">
                      {module.tasks.length} Coding Tasks
                    </Typography>
                  </Box>
                </CardContent>
                
                <CardActions>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => router.push(`/modules/${module.path}`)}
                  >
                    Start Learning
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Special Features
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Random Practice
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Test your knowledge with random theory, questions, and tasks from across all topics.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  color="primary"
                  onClick={() => router.push('/random')}
                >
                  Try Random Items
                </Button>
              </CardActions>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" component="h2" gutterBottom>
                  Mock Exams
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Take timed mock interviews with a mix of questions and coding tasks. Get AI feedback on your performance.
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  variant="contained" 
                  color="info"
                  onClick={() => router.push('/mock')}
                >
                  Start Mock Exam
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
      )}
    </Layout>
  );
};

export default HomePage;
