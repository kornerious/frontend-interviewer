import React from 'react';
import { 
  Box, 
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  Typography
} from '@mui/material';

interface RandomFiltersProps {
  technology: string;
  difficulty: string;
  technologies: string[];
  onTechnologyChange: (event: SelectChangeEvent) => void;
  onDifficultyChange: (event: SelectChangeEvent) => void;
}

const RandomFilters: React.FC<RandomFiltersProps> = ({
  technology,
  difficulty,
  technologies,
  onTechnologyChange,
  onDifficultyChange
}) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Technology</InputLabel>
          <Select
            value={technology}
            label="Technology"
            onChange={onTechnologyChange}
          >
            <MenuItem value="all">All Technologies</MenuItem>
            {technologies.map((tech) => (
              <MenuItem key={tech} value={tech}>{tech}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Difficulty</InputLabel>
          <Select
            value={difficulty}
            label="Difficulty"
            onChange={onDifficultyChange}
          >
            <MenuItem value="all">All Difficulties</MenuItem>
            <MenuItem value="easy">Easy</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="hard">Hard</MenuItem>
          </Select>
        </FormControl>
        
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            Filters apply to new random items
          </Typography>
          <Chip 
            label="Strictly Random" 
            color="secondary" 
            size="small" 
            variant="outlined"
          />
        </Box>
      </Box>
    </Paper>
  );
};

export default RandomFilters;
