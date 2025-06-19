import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  CircularProgress,
  Divider
} from '@mui/material';
import QuizCard from '@/components/questions/QuizCard';
import TaskRunner from '@/components/tasks/TaskRunner';
import { QuestionItem, TaskItem, QuestionType } from '../../../index';

interface SimilarItemsSectionProps {
  item: QuestionItem | TaskItem;
  similarItems: QuestionItem[] | TaskItem[];
  selectedItemId: string | null;
  generatingSimilar: boolean;
  onGenerateSimilar: (item: QuestionItem | TaskItem) => void;
}

// Type guard to check if an item is a QuestionItem
function isQuestionItem(item: QuestionItem | TaskItem): item is QuestionItem {
  return 'type' in item && (item as QuestionItem).type !== undefined;
}

const SimilarItemsSection: React.FC<SimilarItemsSectionProps> = ({
  item,
  similarItems,
  selectedItemId,
  generatingSimilar,
  onGenerateSimilar
}) => {
  return (
    <>
      <Divider sx={{ my: 2 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Practice with similar {isQuestionItem(item) ? 'questions' : 'tasks'}
        </Typography>
        
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={() => onGenerateSimilar(item)}
          disabled={generatingSimilar && selectedItemId === item.id}
        >
          {generatingSimilar && selectedItemId === item.id ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              Generating...
            </>
          ) : (
            'Generate Similar'
          )}
        </Button>
      </Box>
      
      {selectedItemId === item.id && similarItems.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Similar {isQuestionItem(item) ? 'Questions' : 'Tasks'}:
          </Typography>
          
          {similarItems.map((similar: QuestionItem | TaskItem) => (
            <Box key={similar.id} sx={{ mt: 2 }}>
              {isQuestionItem(item) ? (
                <QuizCard question={similar as QuestionItem} />
              ) : (
                <TaskRunner task={similar as TaskItem} />
              )}
            </Box>
          ))}
        </Box>
      )}
    </>
  );
};

export default SimilarItemsSection;
