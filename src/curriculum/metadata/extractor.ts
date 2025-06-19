/**
 * Simple Metadata Extractor
 * 
 * This module extracts metadata from the database.json file and creates a metadata.json file
 * with only the essential fields as specified in the requirements.
 */
import fs from 'fs';
import path from 'path';

// Types
import { 
  TheoryItem, 
  QuestionItem, 
  TaskItem,
  Technology
} from '../../../index';

/**
 * Simple metadata extractor class
 */
export class MetadataExtractor {
  private databasePath: string;
  private outputPath: string;

  /**
   * Constructor
   * @param databasePath Path to database.json
   * @param outputPath Path to output metadata.json
   */
  constructor(databasePath: string, outputPath: string) {
    this.databasePath = databasePath;
    this.outputPath = outputPath;
  }

  /**
   * Extract metadata from database.json
   */
  public async extract(): Promise<any> {
    console.log('MetadataExtractor: Starting metadata extraction from database.json');
    console.log(`MetadataExtractor: Database path: ${this.databasePath}`);
    
    // Check if database.json exists
    console.log('MetadataExtractor: Checking if database.json exists');
    if (!fs.existsSync(this.databasePath)) {
      throw new Error(`Database file not found at ${this.databasePath}`);
    }
    
    // Read database.json
    console.log('MetadataExtractor: Reading database.json');
    const databaseContent = await fs.promises.readFile(this.databasePath, 'utf-8');
    
    // Parse JSON
    console.log('MetadataExtractor: Parsing JSON');
    const database = JSON.parse(databaseContent);
    console.log(`MetadataExtractor: Database loaded, contains ${database.length} containers`);
    
    // Extract metadata
    console.log('MetadataExtractor: Extracting metadata from items');
    const { metadata, stats } = this.extractMetadataFromItems(database);
    console.log(`MetadataExtractor: Extracted metadata for ${stats.theoryItems} theory items, ${stats.questionItems} question items, and ${stats.taskItems} task items`);
    
    // Save metadata to file
    await this.saveMetadata(metadata, stats);
    console.log(`MetadataExtractor: Metadata saved to ${this.outputPath}`);
    
    return { stats };
  }

  /**
   * Extract metadata from database items
   */
  private extractMetadataFromItems(database: any[]): { 
    metadata: any[],
    stats: {
      theoryItems: number;
      questionItems: number;
      taskItems: number;
      totalItems: number;
    }
  } {
    const metadata: any[] = [];
    let theoryCount = 0;
    let questionCount = 0;
    let taskCount = 0;
    
    // Process each container in the database
    database.forEach((container, containerIndex) => {
      // Extract theory items
      if (container.content?.theory && Array.isArray(container.content.theory)) {
        container.content.theory.forEach((item: TheoryItem, itemIndex: number) => {
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
        container.content.questions.forEach((item: QuestionItem, itemIndex: number) => {
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
        container.content.tasks.forEach((item: TaskItem, itemIndex: number) => {
          // Since TaskItem doesn't have irrelevant field in the type definition, we need to check differently
          const isIrrelevant = (item as any).irrelevant === true;          
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
  private async saveMetadata(metadata: any[], stats: any): Promise<void> {
    // Ensure directory exists
    const outputDir = path.dirname(this.outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Create the metadata object with just the extracted items and stats
    const metadataObject = {
      items: metadata,
      stats
    };
    
    // Write metadata to file
    await fs.promises.writeFile(
      this.outputPath, 
      JSON.stringify(metadataObject, null, 2), 
      'utf-8'
    );
    
    // Log file size
    const stats2 = fs.statSync(this.outputPath);
    const fileSizeMB = stats2.size / (1024 * 1024);
    console.log(`MetadataExtractor: Metadata file size: ${fileSizeMB.toFixed(2)} MB`);
  }
}
