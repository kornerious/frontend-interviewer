import React, { useEffect, useState } from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import theme from '@/theme';
import { auth } from '@/services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useUserStore } from '@/store';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAuthPage = router.pathname === '/login' || router.pathname === '/register';
  const [loading, setLoading] = useState(true);
  
  // Check authentication state on app initialization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        console.log('User is signed in:', user.uid);
        useUserStore.getState().setAuthenticated(true, user.uid);
        
        // Load user settings from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.settings) {
              useUserStore.getState().setSettings(userData.settings);
            }
          }
        } catch (error) {
          console.error('Error loading user settings:', error);
        }
      } else {
        // User is signed out
        console.log('User is signed out');
        useUserStore.getState().logout();
        
        // Redirect to login page if trying to access protected routes
        const protectedRoutes = ['/settings', '/modules', '/review/incorrect', '/mock'];
        if (protectedRoutes.some(route => router.pathname.startsWith(route))) {
          router.push('/login');
        }
      }
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {loading ? (
        // You can add a loading spinner here if needed
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          Loading...
        </div>
      ) : isAuthPage ? (
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
