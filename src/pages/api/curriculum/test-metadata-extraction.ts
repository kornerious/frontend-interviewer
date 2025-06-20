import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { CurriculumPaths } from '@/curriculum/utils/curriculumPaths';
import { MetadataExtractor } from '@/curriculum/metadata/extractor';

/**
 * Test endpoint for metadata extraction
 * This is a simplified version that directly calls the MetadataExtractor
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API: test-metadata-extraction endpoint called with method:', req.method);
  
  if (req.method !== 'POST') {
    console.log('API: Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API: Starting test metadata extraction process');
    
    // Define paths for database.json
    const databasePath = CurriculumPaths.getDatabasePath();
    const outputPath = CurriculumPaths.getMetadataPath();
    
    // Check if database.json exists
    if (!fs.existsSync(databasePath)) {
      return res.status(404).json({ 
        error: 'Database file not found',
        path: databasePath
      });
    }
    
    // Create MetadataExtractor instance and extract metadata
    const extractor = new MetadataExtractor(databasePath, outputPath);
    const result = await extractor.extract();
    
    console.log('API: Test metadata extraction complete, returning response');
    
    return res.status(200).json({
      success: true,
      stats: result.stats,
      metadataPath: '/metadata.json'
    });
  } catch (error: any) {
    console.error('API: Error extracting metadata:', error);
    
    // Return detailed error information
    return res.status(500).json({ 
      error: 'Failed to extract metadata', 
      message: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
