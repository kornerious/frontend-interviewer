import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Divider, 
  Alert,
  CircularProgress
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { loginWithEmail, loginWithGoogle } from '@/services/authService';
import { useUserStore } from '@/store';

const Login: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };
  
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const user = await loginWithEmail(email, password);
      // Get user settings from Firestore to initialize the store
      try {
        // Initialize user state with default values if Firestore access fails
        useUserStore.getState().setAuthenticated(true, user.uid);
        useUserStore.getState().setSettings({
          username: user.displayName || email.split('@')[0],
          aiReviewer: 'both'
        });
        router.push('/');
      } catch (storeError) {
        console.error('Error setting user state:', storeError);
        // Still proceed with login even if store update fails
        router.push('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      // Extract Firebase error code and provide more specific error messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid login credentials. Please try again.');
      } else if (error.code === 'permission-denied') {
        setError('Access denied. Please contact support.');
      } else {
        setError(error.message || 'Failed to login. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const user = await loginWithGoogle();
      // Initialize user state with Google profile data
      try {
        useUserStore.getState().setAuthenticated(true, user.uid);
        useUserStore.getState().setSettings({
          username: user.displayName || 'User',
          aiReviewer: 'both'
        });
        router.push('/');
      } catch (storeError) {
        console.error('Error setting user state:', storeError);
        // Still proceed with login even if store update fails
        router.push('/');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      // Extract Firebase error code and provide more specific error messages
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Login canceled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Pop-up blocked by browser. Please enable pop-ups for this site.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setError('An account already exists with the same email address but different sign-in credentials.');
      } else if (error.code === 'permission-denied') {
        setError('Access denied. Please contact support.');
      } else {
        setError(error.message || 'Failed to login with Google.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 2
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          width: '100%', 
          maxWidth: 400,
          borderRadius: 2
        }}
      >
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Login
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Sign in to continue to Frontend Interviewer
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleEmailLogin}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            variant="outlined"
            value={email}
            onChange={handleEmailChange}
            required
            disabled={loading}
          />
          
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={password}
            onChange={handlePasswordChange}
            required
            disabled={loading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Login'}
          </Button>
        </form>
        
        <Divider sx={{ my: 3 }}>or</Divider>
        
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          Sign in with Google
        </Button>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Don't have an account?{' '}
            <Link href="/register" passHref style={{ color: 'primary.main' }}>
              Register
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login;
