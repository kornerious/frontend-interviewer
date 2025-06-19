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
  Switch
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import QuizCard from './QuizCard';
import { QuestionItem } from '../../../index';

interface QuestionListProps {
  questions: QuestionItem[];
}

const QuestionList: React.FC<QuestionListProps> = ({ questions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [hideIrrelevant, setHideIrrelevant] = useState(true);

  // Extract unique tags for filtering
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    questions.forEach(question => {
      question.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [questions]);

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleDifficultyChange = (event: SelectChangeEvent) => {
    setDifficultyFilter(event.target.value);
  };

  const handleTypeChange = (event: SelectChangeEvent) => {
    setTypeFilter(event.target.value);
  };

  const handleTagsChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setSelectedTags(typeof value === 'string' ? value.split(',') : value);
  };

  const handleHideIrrelevantChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHideIrrelevant(event.target.checked);
  };

  // Filter questions based on search term and filters
  const filteredQuestions = questions.filter(question => {
    // Text search
    const matchesSearch = 
      question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      question.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Difficulty filter
    const matchesDifficulty = difficultyFilter === 'all' || question.level === difficultyFilter;
    
    // Type filter
    const matchesType = typeFilter === 'all' || question.type === typeFilter;
    
    // Tags filter
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => question.tags.includes(tag));
    
    // Irrelevant filter
    const matchesIrrelevant = !hideIrrelevant || !question.irrelevant;
    
    return matchesSearch && matchesDifficulty && matchesType && matchesTags && matchesIrrelevant;
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search questions by topic, content, or tags..."
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
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={handleTypeChange}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="mcq">Multiple Choice</MenuItem>
                <MenuItem value="flashcard">Flashcard</MenuItem>
                <MenuItem value="open">Open-ended</MenuItem>
                <MenuItem value="code">Code Trace</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
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
      </Box>
      
      {filteredQuestions.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          No questions found matching your filters.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filteredQuestions.map((question) => (
            <Grid item xs={12} key={question.id}>
              <QuizCard question={question} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default QuestionList;
