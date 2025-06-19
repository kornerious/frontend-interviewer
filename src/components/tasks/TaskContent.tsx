import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Collapse,
  Divider
} from '@mui/material';
import Editor from '@monaco-editor/react';

interface TaskContentProps {
  description: string;
  code: string;
  hints: string[];
  showHints: boolean;
  currentHintIndex: number;
  aiResponse: string;
  isCorrect: boolean | null;
  onCodeChange: (value: string | undefined) => void;
  onShowHintsToggle: () => void;
  onNextHint: () => void;
}

const TaskContent: React.FC<TaskContentProps> = ({
  description,
  code,
  hints,
  showHints,
  currentHintIndex,
  aiResponse,
  isCorrect,
  onCodeChange,
  onShowHintsToggle,
  onNextHint
}) => {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Task Description
        </Typography>
        {/* Render markdown description as HTML */}
        <div 
          dangerouslySetInnerHTML={{ 
            __html: description
              .replace(/\n/g, '<br />')
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
          }} 
        />
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Code Editor
        </Typography>
        <Editor
          height="300px"
          defaultLanguage="javascript"
          value={code}
          onChange={onCodeChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            tabSize: 2
          }}
        />
      </Box>
      
      {hints.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Button 
            variant="outlined" 
            color="info" 
            size="small" 
            onClick={onShowHintsToggle}
          >
            {showHints ? 'Hide Hints' : 'Show Hints'}
          </Button>
          
          <Collapse in={showHints} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Hint {currentHintIndex + 1} of {hints.length}:
              </Typography>
              <Typography variant="body2">
                {hints[currentHintIndex]}
              </Typography>
              
              {currentHintIndex < hints.length - 1 && (
                <Button 
                  size="small" 
                  color="primary" 
                  onClick={onNextHint}
                  sx={{ mt: 1 }}
                >
                  Next Hint
                </Button>
              )}
            </Box>
          </Collapse>
        </Box>
      )}
      
      {aiResponse && (
        <Box sx={{ mt: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            AI Review Result: {isCorrect ? '✅ Correct' : '❌ Needs Improvement'}
          </Typography>
          <Box 
            sx={{ 
              p: 2, 
              bgcolor: 'background.paper', 
              borderRadius: 1,
              border: 1,
              borderColor: isCorrect ? 'success.main' : 'error.main'
            }}
          >
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {aiResponse}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default TaskContent;
