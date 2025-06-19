import { NextApiRequest, NextApiResponse } from 'next';
import { CurriculumGenerator } from '@/curriculum/index';

/**
 * API endpoint for extracting metadata from database.json
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API: extract-metadata endpoint called with method:', req.method);
  
  if (req.method !== 'POST') {
    console.log('API: Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API: Starting metadata extraction process');
    
    // Use the CurriculumGenerator to extract metadata
    const metadata = await CurriculumGenerator.extractMetadata();
    
    console.log('API: Metadata extraction complete, returning response');
    
    // Return only essential statistics to avoid large response size
    return res.status(200).json({
      success: true,
      stats: metadata.stats,
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
