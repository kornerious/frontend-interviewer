import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Menu, 
  MenuItem, 
  Avatar 
} from '@mui/material';
import { Menu as MenuIcon, AccountCircle } from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUserStore } from '@/store';
import { logoutUser } from '@/services/authService';

const Header: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated, uid, settings } = useUserStore(state => ({
    isAuthenticated: state.isAuthenticated,
    uid: state.uid,
    settings: state.settings
  }));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  // Debug authentication state
  useEffect(() => {
    console.log('Header auth state:', { isAuthenticated, uid });
  }, [isAuthenticated, uid]);
  
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      useUserStore.getState().setAuthenticated(false, null);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
    handleClose();
  };

  const handleSettings = () => {
    router.push('/settings');
    handleClose();
  };

  return (
    <AppBar 
      position="fixed" 
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 'none',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        color: 'text.primary'
      }}
    >
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1,
            fontWeight: 'bold',
            '& a': {
              textDecoration: 'none',
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textFillColor: 'transparent'
            }
          }}
        >
          <Link href="/" passHref style={{ textDecoration: 'none' }}>
            Frontend Interviewer
          </Link>
        </Typography>
        
        {isAuthenticated ? (
          <Box>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                {(settings?.username || 'U').charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleSettings}>Settings</MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box>
            <Button 
              color="primary" 
              onClick={() => router.push('/login')}
              sx={{
                color: '#2196F3',
                mr: 1,
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.08)'
                }
              }}
            >
              Login
            </Button>
            <Button 
              color="primary" 
              variant="contained" 
              onClick={() => router.push('/register')}
              sx={{
                boxShadow: '0 3px 5px rgba(33, 150, 243, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 8px rgba(33, 150, 243, 0.4)'
                }
              }}
            >
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
