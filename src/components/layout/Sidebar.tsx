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
        </List>
        
        <Divider sx={{ my: 2 }} />
        
        {/* Learning Modules */}
        <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
          Learning Modules
        </Typography>
        
        <List>
          {/* Learning Paths */}
          {groupedModules.map((group) => (
            <React.Fragment key={group.path}>
              <ListItem 
                button 
                onClick={() => handleModuleClick(group.path)}
              >
                <ListItemIcon>
                  <SchoolIcon color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary={group.path.charAt(0).toUpperCase() + group.path.slice(1)} 
                  primaryTypographyProps={{ noWrap: true }}
                />
                {openModules[group.path] ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              
              <Collapse in={openModules[group.path]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {group.modules.map((module) => (
                    <ListItem 
                      key={module.id}
                      button 
                      component={Link}
                      href={`/modules/${module.id}`}
                      selected={router.asPath.startsWith(`/modules/${module.id}`)}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>
                        {module.technology === 'React' || module.technology === 'Next.js' ? (
                          <CodeIcon color="info" />
                        ) : module.technology === 'JavaScript' || module.technology === 'TypeScript' ? (
                          <SchoolIcon color="warning" />
                        ) : (
                          <QuestionIcon color="success" />
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={module.title} 
                        primaryTypographyProps={{ noWrap: true, fontSize: '0.9rem' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
