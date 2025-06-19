import React, { ReactNode } from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

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
          pt: 8,
          px: 2,
          pb: 4,
          bgcolor: 'background.default',
        }}
      >
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
