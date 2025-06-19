import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import Layout from '@/components/layout/Layout';

/**
 * Debug page for testing curriculum metadata extraction
 */
const CurriculumDebugPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const testDatabaseAccess = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await fetch('/api/curriculum/test-database');
      const data = await response.json();
      
      setResult(data);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const extractMetadata = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await fetch('/api/curriculum/extract-metadata', {
        method: 'POST',
      });
      
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Box sx={{ py: 4, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Curriculum Debug
        </Typography>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Test Database Access
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Button 
              variant="contained" 
              onClick={testDatabaseAccess}
              disabled={loading}
              sx={{ mr: 2 }}
            >
              Test Database Access
            </Button>
            
            <Button 
              variant="contained" 
              color="primary"
              onClick={extractMetadata}
              disabled={loading}
            >
              Extract Metadata
            </Button>
          </Box>
          
          {loading && (
            <Box sx={{ display: 'flex', my: 2 }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Processing...</Typography>
            </Box>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          {result && (
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Result:
                </Typography>
                <pre style={{ 
                  overflow: 'auto', 
                  maxHeight: '400px',
                  backgroundColor: '#f5f5f5',
                  padding: '10px',
                  borderRadius: '4px'
                }}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </Paper>
      </Box>
    </Layout>
  );
};

export default CurriculumDebugPage;
