import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Stepper, 
  Step, 
  StepLabel, 
  Paper, 
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import Layout from '@/components/layout/Layout';
import { useRouter } from 'next/router';
import { MetadataService } from '@/curriculum/utils/metadataService';

/**
 * CurriculumCreatePage guides users through the curriculum generation process
 * starting with metadata extraction from database.json
 */
const CurriculumCreatePage: React.FC = () => {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [metadata, setMetadata] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metadataStats, setMetadataStats] = useState<{
    theoryItems: number;
    questionItems: number;
    taskItems: number;
    totalItems: number;
  } | null>(null);

  const steps = [
    'Extract Metadata',
    'Build Dependency Graphs',
    'Score & Order Items',
    'Create & Process Chunks',
    'Merge & Resolve Dependencies',
    'Compose Final Curriculum'
  ];

  // Check if metadata already exists on component mount
  useEffect(() => {
    const checkMetadata = async () => {
      try {
        console.log('Checking if metadata exists...');
        const exists = await MetadataService.checkMetadataExists();
        console.log('Metadata exists:', exists);
        
        if (exists) {
          console.log('Getting metadata stats...');
          const stats = await MetadataService.getMetadataStats();
          console.log('Got metadata stats:', stats);
          
          if (stats) {
            setMetadataStats(stats);
            setActiveStep(1);
          } else {
            console.error('Failed to get metadata stats');
            setError('Failed to load metadata statistics. Please try extracting metadata again.');
          }
        }
      } catch (err: any) {
        console.error('Error checking metadata:', err);
        setError(`Error checking metadata: ${err.message || 'Unknown error'}`);
      }
    };
    
    checkMetadata();
  }, []);

  const handleExtractMetadata = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      // Call the metadata extraction service
      const result = await MetadataService.extractMetadata();
      
      // Update stats with actual data
      setMetadataStats(result.stats);
      
      setActiveStep(1);
    } catch (err: any) {
      setError(`Failed to extract metadata: ${err.message || 'Unknown error'}`);
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleNextStep = () => {
    // In a real implementation, this would trigger the next step in the process
    // For now, we'll just increment the active step
    setActiveStep(prevStep => Math.min(prevStep + 1, steps.length - 1));
  };

  const handleCancel = () => {
    router.push('/modules');
  };

  return (
    <Layout>
      <Box sx={{ py: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Curriculum Generation
        </Typography>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box>
            {activeStep === 0 ? (
              <Box>
                <Typography variant="h5" gutterBottom>
                  Step 1: Extract Metadata
                </Typography>
                
                <Typography variant="body1" paragraph>
                  This step will extract metadata from your database.json file, including:
                </Typography>
                
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Fields to Extract:
                    </Typography>
                    
                    <Typography variant="body2" paragraph>
                      <strong>TheoryItem:</strong> relatedQuestions, relatedTasks, tags, technology, 
                      difficulty, prerequisites, requiredFor
                    </Typography>
                    
                    <Typography variant="body2" paragraph>
                      <strong>QuestionItem:</strong> relatedTheory, tags, technology, difficulty, 
                      prerequisites
                    </Typography>
                    
                    <Typography variant="body2" paragraph>
                      <strong>TaskItem:</strong> relatedTheory, tags, technology, difficulty, 
                      prerequisites
                    </Typography>
                  </CardContent>
                </Card>
                
                <Typography variant="body1" paragraph>
                  The extracted metadata will be used to build dependency and similarity graphs, 
                  which will be used to score and order curriculum items.
                </Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleCancel}
                    disabled={processing}
                  >
                    Cancel
                  </Button>
                  
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleExtractMetadata}
                    disabled={processing}
                    startIcon={processing && <CircularProgress size={20} color="inherit" />}
                  >
                    {processing ? 'Extracting...' : 'Extract Metadata'}
                  </Button>
                </Box>
              </Box>
            ) : activeStep === 1 ? (
              <Box>
                <Typography variant="h5" gutterBottom>
                  Metadata Extraction Complete
                </Typography>
                
                <Alert severity="success" sx={{ mb: 3 }}>
                  Successfully extracted metadata from database.json
                </Alert>
                
                {metadataStats ? (
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Extraction Statistics:
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 2 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">{metadataStats.theoryItems}</Typography>
                          <Typography variant="body2">Theory Items</Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">{metadataStats.questionItems}</Typography>
                          <Typography variant="body2">Question Items</Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">{metadataStats.taskItems}</Typography>
                          <Typography variant="body2">Task Items</Typography>
                        </Box>
                        
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4">{metadataStats.totalItems}</Typography>
                          <Typography variant="body2">Total Items</Typography>
                        </Box>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="body2">
                        Metadata has been saved to metadata.json in the project root directory.
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    Metadata has been extracted but statistics are not available.
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleCancel}
                  >
                    Back to Modules
                  </Button>
                  
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleNextStep}
                  >
                    Continue to Step 2: Build Dependency Graphs
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h6">
                  This step is not yet implemented
                </Typography>
                
                <Button 
                  variant="outlined" 
                  onClick={handleCancel}
                  sx={{ mt: 2 }}
                >
                  Back to Modules
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Layout>
  );
};

export default CurriculumCreatePage;
