/**
 * Admin interface for generating and managing the curriculum
 * 
 * This page provides controls to run different phases of the curriculum generation pipeline:
 * 1. Extract metadata
 * 2. Build dependency graphs
 * 3. Calculate scores
 * 4. Process chunks with AI
 * 5. Aggregate and assemble the final curriculum
 */

import { useState } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Stepper, 
  Step, 
  StepLabel,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import { CurriculumPaths } from '@/curriculum/utils/curriculumPaths';

export default function GenerateCurriculum() {
  const [activePhase, setActivePhase] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Define the curriculum generation phases
  const phases = [
    { 
      id: 1, 
      title: 'Extract Metadata', 
      description: 'Extract tags, prerequisites, complexity, and other metadata from the database',
      endpoint: '/api/curriculum/extract-metadata'
    },
    { 
      id: 2, 
      title: 'Build Dependency Graphs', 
      description: 'Build global dependency and similarity graphs for curriculum items',
      endpoint: '/api/curriculum/build-graphs'
    },
    { 
      id: 3, 
      title: 'Calculate Scores', 
      description: 'Calculate scores for item ordering based on complexity and dependencies',
      endpoint: '/api/curriculum/calculate-scores'
    },
    { 
      id: 4, 
      title: 'Process Chunks with AI', 
      description: 'Process chunked content with AI for thematic clustering',
      endpoint: '/api/curriculum/process-chunks'
    },
    { 
      id: 5, 
      title: 'Aggregate and Assemble', 
      description: 'Aggregate processed chunks, resolve dependencies, order items, and generate final curriculum',
      endpoint: '/api/curriculum/run-aggregation'
    }
  ];

  // Function to run a curriculum generation phase
  const runPhase = async (phaseId: number, endpoint: string) => {
    setActivePhase(phaseId);
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccess(`Phase ${phaseId}: ${phases[phaseId-1].title} completed successfully!`);
      } else {
        setError(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setError(`Error: ${err.message || 'Unknown error occurred'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to run the complete pipeline
  const runCompletePipeline = async () => {
    for (const phase of phases) {
      await runPhase(phase.id, phase.endpoint);
      
      // If any phase fails, stop the pipeline
      if (error) {
        break;
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Curriculum Generation Pipeline
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1" paragraph>
          This tool generates the curriculum by running the curriculum generation pipeline. 
          Each phase builds upon the previous one, so they should be run in order.
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={() => runCompletePipeline()}
          disabled={loading}
          sx={{ mb: 2 }}
        >
          Run Complete Pipeline
        </Button>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      <Typography variant="h5" component="h2" gutterBottom>
        Individual Phases
      </Typography>
      
      <Stepper activeStep={activePhase ? activePhase - 1 : -1} alternativeLabel sx={{ mb: 4 }}>
        {phases.map((phase) => (
          <Step key={phase.id}>
            <StepLabel>{phase.title}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {phases.map((phase) => (
          <Paper key={phase.id} sx={{ p: 3 }}>
            <Typography variant="h6" component="h3" gutterBottom>
              {phase.id}. {phase.title}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {phase.description}
            </Typography>
            
            <Button 
              variant="outlined" 
              onClick={() => runPhase(phase.id, phase.endpoint)}
              disabled={loading && activePhase === phase.id}
              startIcon={loading && activePhase === phase.id ? <CircularProgress size={20} /> : null}
            >
              {loading && activePhase === phase.id ? 'Running...' : 'Run Phase'}
            </Button>
          </Paper>
        ))}
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Curriculum File Locations
        </Typography>
        
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {`
Database: ${CurriculumPaths.getDatabasePath()}
Metadata: ${CurriculumPaths.getMetadataPath()}
Graphs: ${CurriculumPaths.getGraphsPath()}
Scores: ${CurriculumPaths.getScoresPath()}
Chunks Directory: ${CurriculumPaths.getChunksDir()}
Processed Chunks: ${CurriculumPaths.getChunksProcessedPath()}
Final Curriculum: ${CurriculumPaths.getCurriculumPath()}
            `}
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}
