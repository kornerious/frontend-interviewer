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
import { registerWithEmail, loginWithGoogle } from '@/services/authService';
import { useUserStore } from '@/store';

const Register: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };
  
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };
  
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };
  
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const user = await registerWithEmail(email, password, username);
      useUserStore.getState().setAuthenticated(true, user.uid);
      useUserStore.getState().setSettings({ username, aiReviewer: 'both' });
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleRegister = async () => {
    setError('');
    setLoading(true);
    
    try {
      const user = await loginWithGoogle();
      useUserStore.getState().setAuthenticated(true, user.uid);
      router.push('/');
    } catch (error: any) {
      setError(error.message || 'Failed to register with Google.');
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
          Register
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Create an account to start your interview preparation
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleEmailRegister}>
          <TextField
            label="Username"
            type="text"
            fullWidth
            margin="normal"
            variant="outlined"
            value={username}
            onChange={handleUsernameChange}
            required
            disabled={loading}
          />
          
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
            helperText="Password must be at least 6 characters"
          />
          
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            variant="outlined"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            required
            disabled={loading}
            error={password !== confirmPassword && confirmPassword !== ''}
            helperText={
              password !== confirmPassword && confirmPassword !== '' 
                ? 'Passwords do not match' 
                : ''
            }
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
            {loading ? <CircularProgress size={24} /> : 'Register'}
          </Button>
        </form>
        
        <Divider sx={{ my: 3 }}>or</Divider>
        
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleRegister}
          disabled={loading}
        >
          Register with Google
        </Button>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link href="/login" passHref style={{ color: 'primary.main' }}>
              Login
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
