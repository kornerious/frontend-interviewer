import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import Layout from '@/components/layout/Layout';
import Link from 'next/link';

const ModulesIndexPage: React.FC = () => {
  return (
    <Layout>
      <Box sx={{ 
        py: 4, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        textAlign: 'center'
      }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Curriculum Generation in Progress
        </Typography>
        
        <Box sx={{ maxWidth: 600, mb: 4 }}>
          <Typography variant="body1" paragraph>
            The curriculum modules are currently being generated through our multi-phase process:
          </Typography>
          
          <Box sx={{ 
            textAlign: 'left', 
            bgcolor: 'background.paper', 
            p: 2, 
            borderRadius: 1,
            mb: 3,
            boxShadow: 1
          }}>
            <Typography component="div" sx={{ mb: 1 }}>
              <strong>Phase 1:</strong> Metadata extraction from database.json ✓
            </Typography>
            <Typography component="div" sx={{ mb: 1 }}>
              <strong>Phase 2:</strong> AI-assisted clustering with Gemini 2.5 Flash
            </Typography>
            <Typography component="div" sx={{ mb: 1 }}>
              <strong>Phase 3:</strong> Final aggregation and curriculum assembly
            </Typography>
            <Typography component="div">
              <strong>Phase 4:</strong> Runtime adaptation based on user progress
            </Typography>
          </Box>
          
          <Typography variant="body1" paragraph>
            Please check back later when the curriculum has been fully generated and optimized.
          </Typography>
        </Box>
        
        <Link href="/" passHref>
          <Button variant="contained" color="primary">
            Return to Home
          </Button>
        </Link>
      </Box>
    </Layout>
  );
};

export default ModulesIndexPage;
