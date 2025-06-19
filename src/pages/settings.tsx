import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button, 
  FormControl, 
  FormLabel, 
  RadioGroup, 
  FormControlLabel, 
  Radio, 
  Alert,
  Divider,
  CircularProgress
} from '@mui/material';
import Layout from '@/components/layout/Layout';
import { useUserStore } from '@/store';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/services/firebase';
import { useRouter } from 'next/router';

const SettingsPage = () => {
  const router = useRouter();
  const { isAuthenticated, uid, settings, setSettings } = useUserStore();
  
  const [username, setUsername] = useState(settings.username || '');
  const [aiReviewer, setAiReviewer] = useState(settings.aiReviewer || 'both');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);
  
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };
  
  const handleAiReviewerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAiReviewer(e.target.value as 'deepseek' | 'gemini' | 'both');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');
    
    console.log('Settings form submitted');
    console.log('Current auth state:', { isAuthenticated, uid });
    
    try {
      // Check if user is authenticated
      if (!auth.currentUser) {
        console.error('ERROR: No authenticated user');
        throw new Error('User not authenticated');
      }
      
      const currentUid = auth.currentUser.uid;
      console.log('Current authenticated user:', currentUid);
      
      const updatedSettings = {
        username,
        aiReviewer: aiReviewer as 'deepseek' | 'gemini' | 'both',
        updatedAt: new Date().toISOString()
      };
      
      console.log('About to update settings for user:', currentUid);
      console.log('New settings:', updatedSettings);
      
      // Get reference to user document
      const userDocRef = doc(db, 'users', currentUid);
      
      try {
        // Check if document exists
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
          console.log('User document exists, updating settings');
          // Update only the settings field
          await setDoc(userDocRef, { settings: updatedSettings }, { merge: true });
        } else {
          console.log('User document does not exist, creating it');
          // Create new user document with settings
          await setDoc(userDocRef, {
            settings: updatedSettings,
            progress: {},
            submissions: [],
            sessions: [],
            exams: []
          });
        }
        
        console.log('Settings updated successfully in Firestore');
        setSettings(updatedSettings);
        setSuccess(true);
      } catch (updateError: any) {
        console.error('Firebase error:', updateError.code, updateError.message);
        throw updateError;
      }
    } catch (err: any) {
      console.error('Settings update failed:', err);
      setError(err.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <Layout>
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        py: 4
      }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Settings
        </Typography>
        
        <Paper sx={{ 
          p: 4, 
          mt: 3,
          width: '100%',
          maxWidth: '800px',
          mx: 'auto',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Settings updated successfully!
            </Alert>
          )}
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="500" color="primary.main">
                Profile Settings
              </Typography>
              
              <TextField
                label="Username *"
                fullWidth
                margin="normal"
                value={username}
                onChange={handleUsernameChange}
                required
                disabled={loading}
                helperText="This name will be displayed in your profile"
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  maxWidth: '100%'
                }}
              />
            </Box>
            
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom fontWeight="500" color="primary.main">
                AI Reviewer Settings
              </Typography>
              
              <FormControl component="fieldset" sx={{ width: '100%', mt: 2 }}>
                <FormLabel component="legend" sx={{ color: 'text.secondary', mb: 1 }}>Choose AI Reviewer</FormLabel>
                <RadioGroup
                  value={aiReviewer}
                  onChange={handleAiReviewerChange}
                  sx={{ '& .MuiFormControlLabel-root': { my: 0.5 } }}
                >
                  <FormControlLabel 
                    value="deepseek" 
                    control={<Radio sx={{ color: 'primary.main' }} />} 
                    label="DeepSeek R1 (Faster, more concise feedback)"
                  />
                  <FormControlLabel 
                    value="gemini" 
                    control={<Radio sx={{ color: 'primary.main' }} />} 
                    label="Gemini 2.5 Flash (More detailed feedback)"
                  />
                  <FormControlLabel 
                    value="both" 
                    control={<Radio sx={{ color: 'primary.main' }} />} 
                    label="Both (Compare feedback from both models)"
                  />
                </RadioGroup>
              </FormControl>
            </Box>
            
            <Box sx={{ mt: 5, display: 'flex', justifyContent: 'center' }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
                sx={{ 
                  px: 4, 
                  py: 1, 
                  borderRadius: 2,
                  boxShadow: '0 3px 5px rgba(33, 150, 243, 0.3)',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(33, 150, 243, 0.4)'
                  }
                }}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </Layout>
  );
};

export default SettingsPage;
