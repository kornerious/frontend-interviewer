import React from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import theme from '@/theme';
import '@/styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAuthPage = router.pathname === '/login' || router.pathname === '/register';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isAuthPage ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </ThemeProvider>
  );
}

export default MyApp;
