/**
 * Simple script to test metadata extraction directly
 */
const fs = require('fs');
const path = require('path');

// Define paths
const rootDir = process.cwd();
const databasePath = path.join(rootDir, 'database.json');
const outputPath = path.join(rootDir, 'metadata.json');

console.log('Starting metadata extraction test script');
console.log(`Database path: ${databasePath}`);
console.log(`Output path: ${outputPath}`);

// Check if database.json exists
if (!fs.existsSync(databasePath)) {
  console.error(`Database file not found at ${databasePath}`);
  process.exit(1);
}

// Read database.json
console.log('Reading database.json');
const databaseContent = fs.readFileSync(databasePath, 'utf-8');
console.log(`Database file size: ${(databaseContent.length / (1024 * 1024)).toFixed(2)} MB`);

// Parse JSON
console.log('Parsing JSON');
const database = JSON.parse(databaseContent);
console.log(`Database loaded, contains ${database.length} containers`);

// Extract metadata
console.log('Extracting metadata from items');
const { metadata, stats } = extractMetadataFromItems(database);
console.log(`Extracted metadata for ${stats.theoryItems} theory items, ${stats.questionItems} question items, and ${stats.taskItems} task items`);

// Save metadata to file
saveMetadata(metadata, stats);
console.log(`Metadata saved to ${outputPath}`);

/**
 * Extract metadata from database items
 */
function extractMetadataFromItems(database) {
  const metadata = [];
  let theoryCount = 0;
  let questionCount = 0;
  let taskCount = 0;
  
  // Process each container in the database
  database.forEach((container, containerIndex) => {
    // Extract theory items
    if (container.content?.theory && Array.isArray(container.content.theory)) {
      container.content.theory.forEach((item, itemIndex) => {
        if (item.irrelevant !== true) {
          // Extract only the specified fields for TheoryItem
          const theoryMetadata = {
            id: item.id,
            title: item.title,
            type: 'theory',
            relatedQuestions: item.relatedQuestions || [],
            relatedTasks: item.relatedTasks || [],
            tags: item.tags || [],
            technology: item.technology,
            prerequisites: item.prerequisites || [],
            complexity: item.complexity,
            interviewRelevance: item.interviewRelevance,
            learningPath: item.learningPath,
            requiredFor: item.requiredFor || [],
            originalIndex: containerIndex * 1000 + itemIndex
          };
          
          metadata.push(theoryMetadata);
          theoryCount++;
        }
      });
    }
    
    // Extract question items
    if (container.content?.questions && Array.isArray(container.content.questions)) {
      container.content.questions.forEach((item, itemIndex) => {
        if (item.irrelevant !== true) {
          // Extract only the specified fields for QuestionItem
          const questionMetadata = {
            id: item.id,
            type: 'question',
            topic: item.topic,
            level: item.level,
            questionType: item.type, // Using questionType to avoid conflict with 'type' field
            analysisPoints: item.analysisPoints || [],
            keyConcepts: item.keyConcepts || [],
            evaluationCriteria: item.evaluationCriteria || [],
            tags: item.tags || [],
            complexity: item.complexity,
            interviewFrequency: item.interviewFrequency,
            learningPath: item.learningPath,
            originalIndex: containerIndex * 1000 + itemIndex
          };
          
          metadata.push(questionMetadata);
          questionCount++;
        }
      });
    }
    
    // Extract task items
    if (container.content?.tasks && Array.isArray(container.content.tasks)) {
      container.content.tasks.forEach((item, itemIndex) => {
        // Check for irrelevant flag
        const isIrrelevant = item.irrelevant === true;
        if (!isIrrelevant) {
          // Extract only the specified fields for TaskItem
          const taskMetadata = {
            id: item.id,
            title: item.title,
            type: 'task',
            difficulty: item.difficulty,
            tags: item.tags || [],
            prerequisites: item.prerequisites || [],
            complexity: item.complexity,
            interviewRelevance: item.interviewRelevance,
            learningPath: item.learningPath,
            relatedConcepts: item.relatedConcepts || [],
            originalIndex: containerIndex * 1000 + itemIndex
          };
          
          metadata.push(taskMetadata);
          taskCount++;
        }
      });
    }
  });
  
  return {
    metadata,
    stats: {
      theoryItems: theoryCount,
      questionItems: questionCount,
      taskItems: taskCount,
      totalItems: theoryCount + questionCount + taskCount
    }
  };
}

/**
 * Save metadata to file
 */
function saveMetadata(metadata, stats) {
  // Ensure directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Create the metadata object with just the extracted items and stats
  const metadataObject = {
    items: metadata,
    stats
  };
  
  // Write metadata to file
  fs.writeFileSync(
    outputPath, 
    JSON.stringify(metadataObject, null, 2), 
    'utf-8'
  );
  
  // Log file size
  const fileStats = fs.statSync(outputPath);
  const fileSizeMB = fileStats.size / (1024 * 1024);
  console.log(`Metadata file size: ${fileSizeMB.toFixed(2)} MB`);
}
