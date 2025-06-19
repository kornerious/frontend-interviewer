import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea, 
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { useRouter } from 'next/router';
import Layout from '@/components/layout/Layout';
import { useDataStore } from '@/store';
import type { Module } from '@/types';

const ModulesPage: React.FC = () => {
  const router = useRouter();
  const { modules, loadData } = useDataStore();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        if (modules.length === 0) {
          await loadData();
        }
        setLoading(false);
      } catch (err) {
        console.error('Failed to load modules:', err);
        setError('Failed to load modules. Please try again later.');
        setLoading(false);
      }
    };

    initializeData();
  }, [modules.length, loadData]);

  const handleModuleClick = (path: string) => {
    router.push(`/modules/${path}`);
  };

  // Group modules by technology
  const modulesByTechnology = modules.reduce<Record<string, Module[]>>((acc, module) => {
    const tech = module.technology;
    if (!acc[tech]) {
      acc[tech] = [];
    }
    acc[tech].push(module);
    return acc;
  }, {});

  const renderModuleCard = (module: Module) => (
    <Grid item xs={12} sm={6} md={4} key={module.id}>
      <Card 
        sx={{ 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          backgroundColor: '#121212',
          '&:hover': {
            backgroundColor: '#1e1e1e',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)'
          }
        }}
      >
        <CardActionArea 
          sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
          onClick={() => handleModuleClick(module.path)}
        >
          <CardContent sx={{ flexGrow: 1, width: '100%' }}>
            <Typography gutterBottom variant="h5" component="div" color="primary">
              {module.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {module.description}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
              <Chip 
                label={module.learningPath} 
                size="small" 
                color={
                  module.learningPath === 'beginner' ? 'success' :
                  module.learningPath === 'intermediate' ? 'info' :
                  module.learningPath === 'advanced' ? 'warning' : 'error'
                }
              />
              {module.tags.map(tag => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">
                {module.theory.length} Theory Items
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {module.questions.length} Questions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {module.tasks.length} Tasks
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>
      </Card>
    </Grid>
  );

  return (
    <Layout>
      <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Learning Modules
        </Typography>
        <Typography variant="body1" paragraph>
          Select a module to begin your learning journey. Modules are organized by technology and difficulty level.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : (
          Object.entries(modulesByTechnology).map(([technology, techModules]) => (
            <Box key={technology} sx={{ mb: 6 }}>
              <Typography variant="h5" component="h2" sx={{ mb: 2, color: 'primary.main' }}>
                {technology}
              </Typography>
              <Grid container spacing={3}>
                {techModules.map(renderModuleCard)}
              </Grid>
            </Box>
          ))
        )}
      </Box>
    </Layout>
  );
};

export default ModulesPage;
