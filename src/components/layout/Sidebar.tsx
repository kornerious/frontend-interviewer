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
  ExpandMore
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
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          bgcolor: 'background.paper',
          pt: 8,
        },
      }}
    >
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {/* Special Pages */}
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
        
        <Divider sx={{ my: 2 }} />
        
        {/* Learning Modules Label - Non-clickable */}
        <Box sx={{ 
          bgcolor: '#2196f3', // Blue background
          color: 'white',
          px: 2, 
          py: 0.5,
          mx: 2,
          borderRadius: 1,
          fontSize: '0.875rem',
          fontWeight: 'medium',
          textAlign: 'center'
        }}>
          Learning Modules
        </Box>
        
        <List>
          {/* Add Module Detail Page as a main page */}
          <ListItem 
            button 
            component={Link} 
            href="/modules"
            selected={router.pathname === '/modules'}
          >
            <ListItemIcon>
              <SchoolIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Module Detail" />
          </ListItem>
          
          {/* Learning Paths - simplified, non-expandable list */}
          {groupedModules.slice(0, 5).map((group) => (
            <ListItem 
              key={group.path}
              button 
              component={Link}
              href={`/modules/${group.modules[0]?.id || ''}`}
              sx={{ pl: 4 }}
            >
              <ListItemIcon>
                <CodeIcon color="info" />
              </ListItemIcon>
              <ListItemText 
                primary={group.path.charAt(0).toUpperCase() + group.path.slice(1)} 
                primaryTypographyProps={{ noWrap: true, fontSize: '0.9rem' }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
