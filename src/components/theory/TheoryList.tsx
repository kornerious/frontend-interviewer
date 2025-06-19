import React, { useState } from 'react';
import { Box, Typography, Grid, TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import TheoryCard from './TheoryCard';
import TheoryView from './TheoryView';
import { TheoryItem } from '../../../index';

interface TheoryListProps {
  theories: TheoryItem[];
}

const TheoryList: React.FC<TheoryListProps> = ({ theories }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTheory, setSelectedTheory] = useState<TheoryItem | null>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleTheoryClick = (theory: TheoryItem) => {
    setSelectedTheory(theory);
  };

  const handleBackToList = () => {
    setSelectedTheory(null);
  };

  // Filter theories based on search term
  const filteredTheories = theories.filter(theory => 
    theory.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    theory.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    theory.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      {selectedTheory ? (
        <Box>
          <Box sx={{ mb: 2 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                cursor: 'pointer', 
                color: 'primary.main',
                display: 'inline-flex',
                alignItems: 'center',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={handleBackToList}
            >
              ← Back to Theory List
            </Typography>
          </Box>
          <TheoryView theory={selectedTheory} />
        </Box>
      ) : (
        <Box>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search theories by title, tags, or content..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          {filteredTheories.length === 0 ? (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              No theory items found matching your search.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {filteredTheories.map((theory) => (
                <Grid item xs={12} key={theory.id}>
                  <TheoryCard 
                    theory={theory} 
                    onClick={handleTheoryClick} 
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Box>
  );
};

export default TheoryList;
