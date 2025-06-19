import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  TextField, 
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  SelectChangeEvent,
  FormGroup,
  FormControlLabel,
  Switch,
  Slider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import TaskRunner from './TaskRunner';
import { TaskItem } from '../../../index';

interface TaskListProps {
  tasks: TaskItem[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [hideIrrelevant, setHideIrrelevant] = useState(true);
  const [timeRange, setTimeRange] = useState<number[]>([0, 60]);

  // Extract unique tags for filtering
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    tasks.forEach(task => {
      task.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [tasks]);

  // Find min and max time estimates
  const timeRange1 = useMemo(() => {
    if (tasks.length === 0) return [0, 60];
    const min = Math.min(...tasks.map(task => task.timeEstimate));
    const max = Math.max(...tasks.map(task => task.timeEstimate));
    return [min, max];
  }, [tasks]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setDifficultyFilter(event.target.value);
  };

  const handleTagsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedTags(typeof value === 'string' ? value.split(',') : value);
  };

  const handleHideIrrelevantChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHideIrrelevant(event.target.checked);
  };

  const handleTimeRangeChange = (event: Event, newValue: number | number[]) => {
    setTimeRange(newValue as number[]);
  };

  // Filter tasks based on search term and filters
  const filteredTasks = tasks.filter(task => {
    // Text search
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Difficulty filter
    const matchesDifficulty = difficultyFilter === 'all' || task.difficulty === difficultyFilter;
    
    // Tags filter
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => task.tags.includes(tag));
    
    // Time range filter
    const matchesTimeRange = 
      task.timeEstimate >= timeRange[0] && 
      task.timeEstimate <= timeRange[1];
    
    // Irrelevant filter
    const matchesIrrelevant = !hideIrrelevant || !task.irrelevant;
    
    return matchesSearch && matchesDifficulty && matchesTags && matchesTimeRange && matchesIrrelevant;
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search tasks by title, description, or tags..."
          value={searchTerm}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Difficulty</InputLabel>
              <Select
                value={difficultyFilter}
                label="Difficulty"
                onChange={handleDifficultyChange}
              >
                <MenuItem value="all">All Difficulties</MenuItem>
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Tags</InputLabel>
              <Select
                multiple
                value={selectedTags}
                onChange={handleTagsChange}
                label="Tags"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {allTags.map((tag) => (
                  <MenuItem key={tag} value={tag}>
                    {tag}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={hideIrrelevant}
                    onChange={handleHideIrrelevantChange}
                  />
                }
                label="Hide Irrelevant"
              />
            </FormGroup>
          </Grid>
        </Grid>
        
        <Box sx={{ px: 2, mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            Time Estimate (minutes): {timeRange[0]} - {timeRange[1]}
          </Typography>
          <Slider
            value={timeRange}
            onChange={handleTimeRangeChange}
            valueLabelDisplay="auto"
            min={timeRange1[0]}
            max={timeRange1[1]}
          />
        </Box>
      </Box>
      
      {filteredTasks.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No tasks found matching your filters.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filteredTasks.map((task) => (
            <Grid item xs={12} key={task.id}>
              <TaskRunner task={task} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default TaskList;
