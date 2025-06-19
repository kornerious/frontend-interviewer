import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Button, 
  Chip, 
  Box 
} from '@mui/material';
import { TheoryItem } from '../../../index';

interface TheoryCardProps {
  theory: TheoryItem;
  onClick: (theory: TheoryItem) => void;
}

const TheoryCard: React.FC<TheoryCardProps> = ({ theory, onClick }) => {
  // Create a short excerpt from the content
  const createExcerpt = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <Card 
      sx={{ 
        mb: 2, 
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 6px 12px rgba(0, 0, 0, 0.3)',
        }
      }}
    >
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          {theory.title}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {createExcerpt(theory.content)}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {theory.tags.map((tag) => (
            <Chip 
              key={tag} 
              label={tag} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip 
            label={theory.technology} 
            color="secondary" 
            size="small"
          />
          <Chip 
            label={theory.learningPath} 
            color="info" 
            size="small"
          />
          <Chip 
            label={`Complexity: ${theory.complexity}`} 
            color="default" 
            size="small"
          />
        </Box>
      </CardContent>
      
      <CardActions>
        <Button 
          size="small" 
          color="primary" 
          onClick={() => onClick(theory)}
        >
          Read More
        </Button>
        
        {theory.examples.length > 0 && (
          <Typography variant="caption" color="text.secondary">
            {theory.examples.length} example{theory.examples.length > 1 ? 's' : ''}
          </Typography>
        )}
      </CardActions>
    </Card>
  );
};

export default TheoryCard;
