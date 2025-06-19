import React, { ReactNode } from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

// Sidebar width defined in Sidebar.tsx
const drawerWidth = 240;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Header />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 0, // Remove padding top
          pb: 2,
          width: `calc(100% - ${drawerWidth}px)`,
          marginLeft: `120px`,
          bgcolor: '#121212', // Darker background for content area
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Box sx={{ 
          width: '100%', 
          maxWidth: '100%', 
          px: 3, 
          pt: 3, // Move padding to inner content box for header space
          pb: 2,
          flexGrow: 1
        }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
