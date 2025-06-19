import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Collapse,
  Box,
  Typography
} from '@mui/material';
import { 
  School as SchoolIcon,
  QuestionAnswer as QuestionIcon,
  Code as CodeIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Settings as SettingsIcon,
  ExpandLess,
  ExpandMore,
  DesktopMac as DesktopMacIcon
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDataStore } from '@/store';
import { groupByLearningPath } from '@/services/dataService';
import { Module } from '@/types';

const drawerWidth = 240;

const Sidebar: React.FC = () => {
  const router = useRouter();
  const { modules } = useDataStore();
  const [groupedModules, setGroupedModules] = useState<{path: string, modules: Module[]}[]>([]);
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (modules.length > 0) {
      const moduleGroups = groupByLearningPath(modules);
      setGroupedModules(moduleGroups.map(group => ({
        path: group.path,
        modules: group.modules
      })));
    }
  }, [modules]);

  const handleModuleClick = (moduleId: string) => {
    setOpenModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  return (
    <Box
      sx={{
        width: drawerWidth,
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        zIndex: (theme) => theme.zIndex.drawer,
        bgcolor: 'background.paper',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo and App Name */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 2,
        mb: 1,
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: '10%',
          width: '80%',
          height: '1px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.05)'
        }
      }}>
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#2196F3',
            borderRadius: '50%',
            p: 1.5,
            mb: 1.5,
            width: 56,
            height: 56,
            boxShadow: '0 3px 5px rgba(0,0,0,0.2)'
          }}
        >
          <DesktopMacIcon 
            sx={{ 
              fontSize: 32, 
              color: 'white'
            }} 
          />
        </Box>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Frontend Interviewer
        </Typography>
      </Box>
      
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {/* Special Pages */}
          {/* Curriculum (renamed from Module Detail) moved to top */}
          <ListItem 
            button 
            component={Link} 
            href="/modules"
            selected={router.pathname === '/modules'}
          >
            <ListItemIcon>
              <SchoolIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Curriculum" />
          </ListItem>
          
          <ListItem 
            button 
            component={Link} 
            href="/random"
            selected={router.pathname === '/random'}
          >
            <ListItemIcon>
              <RefreshIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Random Chunk" />
          </ListItem>
          
          <ListItem 
            button 
            component={Link} 
            href="/review/incorrect"
            selected={router.pathname === '/review/incorrect'}
          >
            <ListItemIcon>
              <WarningIcon color="error" />
            </ListItemIcon>
            <ListItemText primary="Incorrect Items" />
          </ListItem>
          
          <ListItem 
            button 
            component={Link} 
            href="/mock"
            selected={router.pathname === '/mock'}
          >
            <ListItemIcon>
              <AssignmentIcon color="secondary" />
            </ListItemIcon>
            <ListItemText primary="Mock Exams" />
          </ListItem>
          
          <ListItem 
            button 
            component={Link} 
            href="/settings"
            selected={router.pathname === '/settings'}
          >
            <ListItemIcon>
              <SettingsIcon color="info" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItem>
        </List>
        
        {/* Learning Modules section removed */}
      </Box>
    </Box>
  );
};

export default Sidebar;
