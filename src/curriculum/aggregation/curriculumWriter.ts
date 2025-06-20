/**
 * CurriculumWriter Component for Curriculum Generation
 * 
 * Responsible for:
 * - Transforming aggregated items to full curriculum objects
 * - Mapping indexes back to full database objects 
 * - Composing the final curriculum.json file
 */

import fs from 'fs';
import path from 'path';
import { AggregatedItem } from './aggregator';

// Interface for database item structure
interface DatabaseItem {
  id: string;
  title: string;
  description?: string;
  theory?: {
    content: string;
    code?: string;
    examples?: Array<{
      code: string;
      explanation?: string;
    }>;
  };
  questions?: Array<{
    content: string;
    answer: string;
    options?: string[];
  }>;
  tasks?: Array<{
    content: string;
    solution?: string;
    tests?: string[];
    constraints?: string[];
    hints?: string[];
  }>;
  [key: string]: any;
}

// Interface for full curriculum item
interface CurriculumItem {
  index: number;
  id: string;
  type: string;
  moduleId?: string;
  complexity?: number;
  title: string;
  description?: string;
  content: any;
  [key: string]: any;
}

export class CurriculumWriter {
  private itemsPath: string;
  private databasePath: string;
  private outputPath: string;

  constructor(config: {
    itemsPath: string;
    databasePath: string;
    outputPath: string;
  }) {
    this.itemsPath = config.itemsPath;
    this.databasePath = config.databasePath;
    this.outputPath = config.outputPath;
  }

  /**
   * Main method to generate the final curriculum
   */
  public async writeCurriculum(): Promise<void> {
    try {
      console.log('CurriculumWriter: Starting final curriculum generation');
      
      // Step 1: Load processed curriculum items
      const processedItems = await this.loadProcessedItems();
      console.log(`CurriculumWriter: Loaded ${processedItems.length} processed items`);
      
      // Step 2: Load the database
      const database = await this.loadDatabase();
      
      // Step 3: Map the processed items to full database objects
      const curriculumItems = this.mapIndexesToFullObjects(processedItems, database);
      console.log(`CurriculumWriter: Mapped ${curriculumItems.length} items to full curriculum objects`);
      
      // Step 4: Save the final curriculum
      await this.saveCurriculum(curriculumItems);
      console.log('CurriculumWriter: Successfully saved final curriculum');
    } catch (error) {
      console.error('CurriculumWriter: Error generating curriculum:', error);
      throw error;
    }
  }
  
  /**
   * Load processed curriculum items
   */
  private async loadProcessedItems(): Promise<AggregatedItem[]> {
    try {
      if (!fs.existsSync(this.itemsPath)) {
        console.error(`CurriculumWriter: Processed items file not found at ${this.itemsPath}`);
        throw new Error(`Processed items file not found at ${this.itemsPath}`);
      }
      
      const content = await fs.promises.readFile(this.itemsPath, 'utf-8');
      return JSON.parse(content) as AggregatedItem[];
    } catch (error) {
      console.error('CurriculumWriter: Error loading processed items:', error);
      throw error;
    }
  }
  
  /**
   * Load the database
   */
  private async loadDatabase(): Promise<Record<string, DatabaseItem>> {
    try {
      if (!fs.existsSync(this.databasePath)) {
        console.error(`CurriculumWriter: Database file not found at ${this.databasePath}`);
        throw new Error(`Database file not found at ${this.databasePath}`);
      }
      
      const content = await fs.promises.readFile(this.databasePath, 'utf-8');
      const rawData = JSON.parse(content);
      
      // Check if database is array format
      if (Array.isArray(rawData)) {
        console.log('CurriculumWriter: Transforming array database into lookup map');
        
        // Transform to lookup by ID format
        const databaseMap: Record<string, DatabaseItem> = {};
        
        // Process items and extract all theory/question/task elements
        rawData.forEach((item: any) => {
          if (item?.content?.theory && Array.isArray(item.content.theory)) {
            // Process theory items
            item.content.theory.forEach((theoryItem: any) => {
              if (theoryItem?.id) {
                databaseMap[theoryItem.id] = {
                  id: theoryItem.id,
                  title: theoryItem.title,
                  description: theoryItem.description || '',
                  type: 'theory',
                  content: theoryItem.content,
                  examples: theoryItem.examples,
                  complexity: theoryItem.complexity,
                  tags: theoryItem.tags,
                  prerequisites: theoryItem.prerequisites,
                  technology: theoryItem.technology
                };
              }
            });
          }
          
          // Process questions if they exist
          if (item?.content?.questions && Array.isArray(item.content.questions)) {
            item.content.questions.forEach((questionItem: any) => {
              if (questionItem?.id) {
                databaseMap[questionItem.id] = {
                  id: questionItem.id,
                  title: questionItem.title || 'Question',
                  description: questionItem.description || '',
                  type: 'question',
                  content: questionItem.content,
                  answer: questionItem.answer,
                  options: questionItem.options,
                  complexity: questionItem.complexity,
                  tags: questionItem.tags
                };
              }
            });
          }
          
          // Process tasks if they exist
          if (item?.content?.tasks && Array.isArray(item.content.tasks)) {
            item.content.tasks.forEach((taskItem: any) => {
              if (taskItem?.id) {
                databaseMap[taskItem.id] = {
                  id: taskItem.id,
                  title: taskItem.title || 'Task',
                  description: taskItem.description || '',
                  type: 'task',
                  content: taskItem.content,
                  solution: taskItem.solution,
                  tests: taskItem.tests,
                  constraints: taskItem.constraints,
                  hints: taskItem.hints,
                  complexity: taskItem.complexity,
                  tags: taskItem.tags
                };
              }
            });
          }
        });
        
        const itemCount = Object.keys(databaseMap).length;
        console.log(`CurriculumWriter: Transformed database with ${itemCount} items`);
        return databaseMap;
      }
      
      // If the database is already in the right format, just validate
      if (!rawData || typeof rawData !== 'object') {
        throw new Error('Invalid database structure');
      }
      
      return rawData;
    } catch (error) {
      console.error('CurriculumWriter: Error loading database:', error);
      throw error;
    }
  }
  
  /**
   * Map processed items to full database objects
   */
  private mapIndexesToFullObjects(
    items: AggregatedItem[],
    database: Record<string, DatabaseItem>
  ): CurriculumItem[] {
    const curriculum: CurriculumItem[] = [];
    
    for (const item of items) {
      // Skip items without an ID
      if (!item.id) {
        console.warn(`CurriculumWriter: Skipping item with index ${item.index} - no ID found`);
        continue;
      }
      
      // Get the database entry for this item
      const dbItem = database[item.id];
      
      // If the database item doesn't exist, create a fallback
      if (!dbItem) {
        console.warn(`CurriculumWriter: Item with ID ${item.id} not found in database, creating fallback`);
        curriculum.push(this.createFallbackItem(item));
        continue;
      }
      
      // Handle nested content (theory, questions, tasks) if needed
      if (item.contentIndex !== undefined) {
        const curriculumItem = this.handleNestedContent(item, dbItem);
        if (curriculumItem) {
          curriculum.push(curriculumItem);
        }
        continue;
      }
      
      // Create a full curriculum item
      curriculum.push({
        index: item.index,
        id: item.id as string, // Safe cast as we checked above
        type: dbItem.type || 'theory',
        moduleId: item.moduleId,
        complexity: item.complexity || dbItem.complexity || 1,
        title: dbItem.title,
        description: dbItem.description,
        content: dbItem,
        tags: dbItem.tags || [],
        prerequisites: dbItem.prerequisites || []
      });
    }
    
    return curriculum;
  }
  
  /**
   * Handle nested content like questions and tasks
   */
  private handleNestedContent(
    item: AggregatedItem, 
    dbItem: DatabaseItem
  ): CurriculumItem | null {
    // Ensure item.id is defined (we already checked above, but TypeScript needs reassurance)
    if (!item.id) {
      return null;
    }
    
    // Get the content type from the item ID
    const idParts = item.id.split('.');
    const contentType = idParts[idParts.length - 2]; // e.g., "questions" in "item1.questions.0"
    const contentIndex = parseInt(idParts[idParts.length - 1], 10); // e.g., 0 in "item1.questions.0"
    
    // Parent ID is everything before the contentType
    const parentId = idParts.slice(0, idParts.length - 2).join('.');
    
    // Handle different content types
    switch (contentType) {
      case 'theory':
        if (dbItem.theory) {
          return {
            index: item.index,
            id: item.id as string, // Safe cast as we checked above
            type: 'theory',
            moduleId: item.moduleId,
            complexity: item.complexity || dbItem.complexity || 1,
            title: dbItem.title,
            description: dbItem.description || 'Theory content',
            content: dbItem.theory,
            tags: dbItem.tags || [],
            prerequisites: dbItem.prerequisites || []
          };
        }
        break;
        
      case 'questions':
        if (dbItem.questions && contentIndex < dbItem.questions.length) {
          const question = dbItem.questions[contentIndex];
          return {
            index: item.index,
            id: item.id as string, // Safe cast as we checked above
            type: 'question',
            moduleId: item.moduleId,
            complexity: item.complexity || dbItem.complexity || 1,
            title: `Question: ${dbItem.title}`,
            description: dbItem.description || 'Question',
            content: question,
            tags: dbItem.tags || [],
            prerequisites: dbItem.prerequisites || [],
            parentId
          };
        }
        break;
        
      case 'tasks':
        if (dbItem.tasks && contentIndex < dbItem.tasks.length) {
          const task = dbItem.tasks[contentIndex];
          return {
            index: item.index,
            id: item.id as string, // Safe cast as we checked above
            type: 'task',
            moduleId: item.moduleId,
            complexity: item.complexity || dbItem.complexity || 1,
            title: `Task: ${dbItem.title}`,
            description: dbItem.description || 'Coding task',
            content: task,
            tags: dbItem.tags || [],
            prerequisites: dbItem.prerequisites || [],
            parentId
          };
        }
        break;
    }
    
    console.warn(`CurriculumWriter: Could not handle nested content for ${item.id}`);
    return null;
  }
  
  /**
   * Create a fallback item when the database entry is not found
   */
  private createFallbackItem(item: AggregatedItem): CurriculumItem {
    return {
      index: item.index,
      id: item.id || `fallback-item-${item.index}`,
      type: 'theory',
      moduleId: item.moduleId,
      complexity: item.complexity || 1,
      title: `Item ${item.index}`,
      description: 'This item was not found in the database',
      content: {
        content: 'Content not available. This item was referenced but not found in the database.'
      },
      tags: [],
      prerequisites: []
    };
  }
  
  /**
   * Save the final curriculum
   */
  private async saveCurriculum(items: CurriculumItem[]): Promise<void> {
    try {
      // Ensure the output directory exists
      const outputDir = path.dirname(this.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Save the curriculum
      await fs.promises.writeFile(
        this.outputPath,
        JSON.stringify(items, null, 2),
        'utf-8'
      );
      
      console.log(`CurriculumWriter: Saved ${items.length} items to ${this.outputPath}`);
    } catch (error) {
      console.error('CurriculumWriter: Error saving curriculum:', error);
      throw error;
    }
  }
}
