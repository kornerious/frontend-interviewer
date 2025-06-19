import React from 'react';
import { Box } from '@mui/material';
import Register from '@/components/auth/Register';
import Layout from '@/components/layout/Layout';

const RegisterPage = () => {
  return (
    <Layout>
      <Box sx={{ py: 4 }}>
        <Register />
      </Box>
    </Layout>
  );
};

export default RegisterPage;
