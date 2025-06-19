import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Divider 
} from '@mui/material';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live';
import { TheoryItem } from '../../../index';

interface TheoryViewProps {
  theory: TheoryItem;
}

const TheoryView: React.FC<TheoryViewProps> = ({ theory }) => {
  return (
    <Paper sx={{ p: 3, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {theory.title}
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
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
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ mb: 4 }}>
        {/* Render markdown content as HTML */}
        <div 
          dangerouslySetInnerHTML={{ 
            __html: theory.content
              .replace(/\n/g, '<br />')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
          }} 
        />
      </Box>
      
      {theory.examples.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Examples
          </Typography>
          
          {theory.examples.map((example) => (
            <Box key={example.id} sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                {example.title}
              </Typography>
              
              <LiveProvider
                code={example.code}
                language={example.language}
                disabled={true}
              >
                <Box sx={{ mb: 2 }}>
                  <LiveEditor 
                    style={{ 
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontFamily: '"Roboto Mono", monospace',
                      backgroundColor: '#2d2d2d'
                    }}
                  />
                </Box>
                <LiveError />
                <LivePreview />
              </LiveProvider>
              
              <Typography variant="body2" sx={{ mt: 2 }}>
                {example.explanation}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      
      {(theory.relatedQuestions.length > 0 || theory.relatedTasks.length > 0) && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Related Content
          </Typography>
          
          {theory.relatedQuestions.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">
                Questions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {theory.relatedQuestions.map((id) => (
                  <Chip 
                    key={id} 
                    label={id.replace('question_', 'Q: ')} 
                    size="small" 
                    color="info"
                    clickable
                  />
                ))}
              </Box>
            </Box>
          )}
          
          {theory.relatedTasks.length > 0 && (
            <Box>
              <Typography variant="subtitle1">
                Tasks:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {theory.relatedTasks.map((id) => (
                  <Chip 
                    key={id} 
                    label={id.replace('task_', 'Task: ')} 
                    size="small" 
                    color="secondary"
                    clickable
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default TheoryView;
