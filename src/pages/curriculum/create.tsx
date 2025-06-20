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
  Divider,
  TextField
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
  const [graphStats, setGraphStats] = useState<any | null>(null);
  const [scoreStats, setScoreStats] = useState<any | null>(null);
  const [chunkStats, setChunkStats] = useState<any | null>(null);

  const steps = [
    'Extract Metadata',
    'Build Dependency Graphs',
    'Score & Order Items',
    'Create & Process Chunks',
    'Merge & Resolve Dependencies',
    'Compose Final Curriculum'
  ];

  // Check for existing files and set the appropriate step on component mount
  useEffect(() => {
    const checkExistingFiles = async () => {
      try {
        console.log('Checking for existing files...');
        
        // Check for AI-processed chunks first (highest priority)
        const chunksExist = await MetadataService.checkChunksExist();
        if (chunksExist) {
          console.log('AI-processed chunks exist, setting step to 4');
          
          // Get metadata stats for display
          const stats = await MetadataService.getMetadataStats();
          if (stats) {
            setMetadataStats(stats);
          }
          
          // Get graph stats
          const graphStats = await MetadataService.getGraphStats();
          if (graphStats) {
            setGraphStats({ stats: graphStats });
          }
          
          // Get score stats
          const scoreStats = await MetadataService.getScoreStats();
          if (scoreStats) {
            setScoreStats(scoreStats);
          }
          
          // Set active step to AI-Assisted Clustering (completed)
          setActiveStep(4);
          return;
        }
        
        // Check for scores (second priority)
        const scoresExist = await MetadataService.checkScoresExist();
        if (scoresExist) {
          console.log('Scores exist, setting step to 3');
          // Get metadata stats for display
          const stats = await MetadataService.getMetadataStats();
          if (stats) {
            setMetadataStats(stats);
          }
          
          // Get graph stats
          const graphStats = await MetadataService.getGraphStats();
          if (graphStats) {
            setGraphStats({ stats: graphStats });
          }
          
          // Get score stats
          const scoreStats = await MetadataService.getScoreStats();
          if (scoreStats) {
            setScoreStats(scoreStats);
          }
          
          // Set active step to Score & Order Items (completed)
          setActiveStep(3);
          return;
        }
        
        // Check for graphs
        const graphsExist = await MetadataService.checkGraphsExist();
        if (graphsExist) {
          console.log('Graphs exist, setting step to 2');
          // Get metadata stats for display
          const stats = await MetadataService.getMetadataStats();
          if (stats) {
            setMetadataStats(stats);
          }
          
          // Get graph stats
          const graphStats = await MetadataService.getGraphStats();
          if (graphStats) {
            setGraphStats({ stats: graphStats });
          }
          
          // Set active step to Build Dependency Graphs (completed)
          setActiveStep(2);
          return;
        }
        
        // Check for metadata
        const metadataExists = await MetadataService.checkMetadataExists();
        if (metadataExists) {
          console.log('Metadata exists, setting step to 1');
          const stats = await MetadataService.getMetadataStats();
          console.log('Got metadata stats:', stats);
          
          if (stats) {
            setMetadataStats(stats);
            // Set active step to Build Dependency Graphs
            setActiveStep(1);
          } else {
            console.error('Failed to get metadata stats');
            setError('Failed to load metadata statistics. Please try extracting metadata again.');
          }
        }
      } catch (err: any) {
        console.error('Error checking existing files:', err);
        setError(`Error checking existing files: ${err.message || 'Unknown error'}`);
      }
    };
    
    checkExistingFiles();
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

  const handleBuildGraphs = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      // Call the graph building service
      const result = await MetadataService.buildGraphs();
      
      // Update graph stats
      setGraphStats(result);
      
      setActiveStep(2);
    } catch (err: any) {
      setError(`Failed to build graphs: ${err.message || 'Unknown error'}`);
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleCalculateScores = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      // Call the score calculation service
      const result = await MetadataService.calculateScores();
      
      // Update score stats
      setScoreStats(result);
      
      setActiveStep(3);
    } catch (err: any) {
      setError(`Failed to calculate scores: ${err.message || 'Unknown error'}`);
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };
  
  const handleProcessChunks = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      // Call the AI chunk processing service using environment variable for API key
      const result = await MetadataService.processChunks();
      
      // Update chunk stats
      setChunkStats(result);
      
      setActiveStep(4);
    } catch (err: any) {
      setError(`Failed to process chunks with AI: ${err.message || 'Unknown error'}`);
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
                  Step 2: Build Global Foundational Graphs
                </Typography>
                
                <Alert severity="info" sx={{ mb: 3 }}>
                  This step will build dependency and similarity graphs from the extracted metadata.
                </Alert>
                
                {metadataStats && (
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Metadata Statistics:
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
                    </CardContent>
                  </Card>
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
                    onClick={handleBuildGraphs}
                    disabled={processing}
                    startIcon={processing && <CircularProgress size={20} color="inherit" />}
                  >
                    {processing ? 'Building Graphs...' : 'Build Graphs'}
                  </Button>
                </Box>
              </Box>
            ) : activeStep === 2 ? (
              <Box>
                <Typography variant="h5" gutterBottom>
                  Step 3: Calculate Initial Deterministic Scores
                </Typography>
                
                {graphStats && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Successfully built dependency and similarity graphs
                  </Alert>
                )}
                
                {graphStats && (
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Graph Building Statistics:
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2">Dependency Graph Nodes: {graphStats.stats?.nodeCount || 0}</Typography>
                        <Typography variant="body2">Dependency Graph Edges: {graphStats.stats?.dependencyEdgeCount || 0}</Typography>
                        <Typography variant="body2">Similarity Graph Nodes: {graphStats.stats?.nodeCount || 0}</Typography>
                        <Typography variant="body2">Similarity Graph Edges: {graphStats.stats?.similarityEdgeCount || 0}</Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="body2">
                        Graphs have been saved to separate files referenced by {graphStats.graphsPath}
                      </Typography>
                    </CardContent>
                  </Card>
                )}
                
                <Typography variant="body1" paragraph>
                  This step will calculate composite scores for each curriculum item based on:
                </Typography>
                
                <ul>
                  <li>Prerequisite Depth (via topological sort)</li>
                  <li>Difficulty and Relevance (weighted sum of complexity, difficulty, level, etc.)</li>
                  <li>Thematic Cohesion (heuristic based on learning path and technology)</li>
                </ul>
                
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
                    onClick={handleCalculateScores}
                    disabled={processing}
                    startIcon={processing && <CircularProgress size={20} color="inherit" />}
                  >
                    {processing ? 'Calculating Scores...' : 'Calculate Scores'}
                  </Button>
                </Box>
              </Box>
            ) : activeStep === 3 ? (
              <Box>
                <Typography variant="h5" gutterBottom>
                  Score Calculation Complete
                </Typography>
                
                {scoreStats && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Successfully calculated scores for {scoreStats.itemsScored || 0} curriculum items
                  </Alert>
                )}
                
                {scoreStats && (
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Score Calculation Results:
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2">Items Scored: {scoreStats.itemsScored || 0}</Typography>
                        <Typography variant="body2">Scores File: {scoreStats.scoresPath || 'scores.json'}</Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="body2">
                        Items have been scored and ordered by composite score in {scoreStats.scoresPath || 'scores.json'}
                      </Typography>
                    </CardContent>
                  </Card>
                )}
                
                <Typography variant="body1" paragraph>
                  Next, we'll use Google Gemini 2.5 Flash to process chunks of the database and identify thematic clusters.
                </Typography>
                
                <Typography variant="body1" paragraph>
                  This step will use the Gemini API key configured in your environment variables.
                </Typography>
                
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
                    onClick={handleProcessChunks}
                    disabled={processing}
                    startIcon={processing && <CircularProgress size={20} color="inherit" />}
                  >
                    {processing ? 'Processing Chunks...' : 'Process Chunks with AI'}
                  </Button>
                </Box>
              </Box>
            ) : activeStep === 4 ? (
              <Box>
                <Typography variant="h5" gutterBottom>
                  AI-Assisted Clustering Complete
                </Typography>
                
                {chunkStats && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    Successfully processed {chunkStats.stats?.processedChunks || 0} chunks with AI
                  </Alert>
                )}
                
                {chunkStats && (
                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        AI Clustering Results:
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2">Total Chunks: {chunkStats.stats?.chunkCount || 0}</Typography>
                        <Typography variant="body2">Processed Chunks: {chunkStats.stats?.processedChunks || 0}</Typography>
                        <Typography variant="body2">Total Items: {chunkStats.stats?.totalItems || 0}</Typography>
                        <Typography variant="body2">Total Clusters: {chunkStats.stats?.totalClusters || 0}</Typography>
                        <Typography variant="body2">Results Directory: {chunkStats.outputDir || 'curriculum/results'}</Typography>
                      </Box>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      <Typography variant="body2">
                        AI has identified thematic clusters and proposed learning sequences for each chunk.
                        The results are saved in {chunkStats.outputDir || 'curriculum/results'}.
                      </Typography>
                    </CardContent>
                  </Card>
                )}
                
                <Typography variant="body1" paragraph>
                  Next, we'll merge the AI-processed chunks, resolve cross-chunk dependencies using the dependency graph,
                  and create a cohesive curriculum sequence.
                </Typography>
                
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
                    Continue to Step 5: Merge & Resolve Dependencies
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
