import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Breadcrumbs, 
  Link as MuiLink,
  CircularProgress,
  Chip
} from '@mui/material';
import Link from 'next/link';
import Layout from '@/components/layout/Layout';
import TheoryList from '@/components/theory/TheoryList';
import QuestionList from '@/components/questions/QuestionList';
import TaskList from '@/components/tasks/TaskList';
import { useDataStore, useUserStore } from '@/store';
import { Module } from '../../../index';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`module-tabpanel-${index}`}
      aria-labelledby={`module-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ModuleDetailPage = () => {
  const router = useRouter();
  const { path } = router.query;
  const [tabValue, setTabValue] = useState(0);
  const [module, setModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { modules, getModuleByPath } = useDataStore();
  const { isAuthenticated } = useUserStore();

  useEffect(() => {
    if (path && typeof path === 'string' && modules.length > 0) {
      const foundModule = getModuleByPath(path);
      setModule(foundModule);
      setLoading(false);
    }
  }, [path, modules, getModuleByPath]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  if (!module) {
    return (
      <Layout>
        <Box sx={{ py: 4 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Module not found
          </Typography>
          <Typography variant="body1" paragraph>
            The module you are looking for does not exist or has been removed.
          </Typography>
          <Link href="/" passHref>
            <MuiLink>Return to home page</MuiLink>
          </Link>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Box sx={{ py: 2 }}>
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link href="/" passHref>
            <MuiLink underline="hover" color="inherit">
              Home
            </MuiLink>
          </Link>
          <Link href={`/technologies/${module.technology.toLowerCase()}`} passHref>
            <MuiLink underline="hover" color="inherit">
              {module.technology}
            </MuiLink>
          </Link>
          <Typography color="text.primary">{module.title}</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              {module.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={module.technology} 
                color="primary" 
                size="small" 
              />
              <Chip 
                label={module.learningPath} 
                color="secondary" 
                size="small" 
              />
              <Chip 
                label={`Complexity: ${module.complexity}`} 
                color="info" 
                size="small" 
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="module tabs"
            variant="fullWidth"
          >
            <Tab 
              label={`Theory (${module.theory.length})`} 
              id="module-tab-0" 
              aria-controls="module-tabpanel-0" 
            />
            <Tab 
              label={`Questions (${module.questions.length})`} 
              id="module-tab-1" 
              aria-controls="module-tabpanel-1" 
            />
            <Tab 
              label={`Tasks (${module.tasks.length})`} 
              id="module-tab-2" 
              aria-controls="module-tabpanel-2" 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TheoryList theories={module.theory} />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <QuestionList questions={module.questions} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <TaskList tasks={module.tasks} />
        </TabPanel>
      </Box>
    </Layout>
  );
};

export default ModuleDetailPage;
