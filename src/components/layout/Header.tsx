import React, { useState } from 'react';
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
  const { isAuthenticated, uid, settings } = useUserStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
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
    <AppBar position="fixed">
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
        
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <Link href="/" passHref style={{ textDecoration: 'none', color: 'inherit' }}>
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
                {settings.displayName.charAt(0).toUpperCase()}
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
            <Button color="inherit" onClick={() => router.push('/login')}>Login</Button>
            <Button color="secondary" variant="contained" onClick={() => router.push('/register')}>
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
