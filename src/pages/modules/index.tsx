import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Stepper, 
  Step, 
  StepLabel, 
  Paper, 
  Divider,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid
} from '@mui/material';
import Layout from '@/components/layout/Layout';
import { useRouter } from 'next/router';

/**
 * ModulesPage component that guides users through the curriculum creation process
 */
const ModulesIndexPage: React.FC = () => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasModules, setHasModules] = useState(false);

  // Check if curriculum modules exist
  useEffect(() => {
    const checkForModules = async () => {
      try {
        setLoading(true);
        // Here we would normally check if modules exist in the database or local storage
        // For now, we'll assume they don't exist
        setHasModules(false);
      } catch (err) {
        setError('Failed to check for existing modules');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    checkForModules();
  }, []);

  const steps = [
    'Extract Metadata',
    'Build Dependency Graphs',
    'Score & Order Items',
    'Create & Process Chunks',
    'Merge & Resolve Dependencies',
    'Compose Final Curriculum'
  ];

  const handleStartGeneration = () => {
    router.push('/curriculum/create');
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ py: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Curriculum Modules
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!hasModules ? (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              No Curriculum Modules Found
            </Typography>
            <Typography variant="body1" paragraph>
              The curriculum needs to be generated before you can access the learning modules.
              This process extracts metadata from your database.json file and organizes it into
              a structured learning path.
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Curriculum Generation Process:
              </Typography>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                What to Expect:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Phase 1: Data Preparation
                      </Typography>
                      <Typography variant="body2">
                        Extracts metadata from database.json and builds dependency graphs
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Phase 2: AI-Assisted Clustering
                      </Typography>
                      <Typography variant="body2">
                        Uses Gemini 2.5 Flash to analyze content and create thematic clusters
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Phase 3: Final Assembly
                      </Typography>
                      <Typography variant="body2">
                        Merges clusters, resolves dependencies, and creates the final curriculum
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Button 
              variant="contained" 
              color="primary" 
              size="large"
              onClick={handleStartGeneration}
            >
              Start Curriculum Generation
            </Button>
          </Paper>
        ) : (
          <Typography variant="body1">
            Curriculum modules will be displayed here once they are loaded.
          </Typography>
        )}
      </Box>
    </Layout>
  );
};

export default ModulesIndexPage;
