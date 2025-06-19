import React from 'react';
import { Box } from '@mui/material';
import Login from '@/components/auth/Login';
import Layout from '@/components/layout/Layout';

const LoginPage = () => {
  return (
    <Layout>
      <Box sx={{ py: 4 }}>
        <Login />
      </Box>
    </Layout>
  );
};

export default LoginPage;
