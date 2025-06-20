/**
 * API endpoint for reading the graphs index file
 */
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { CurriculumPaths } from '@/curriculum/utils/curriculumPaths';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('API: Reading graphs index file');
    
    // Define path to graphs.json
    const graphsPath = path.join(CurriculumPaths.getCurriculumDir(), 'graphs-dependency.json');
    const similarityPath = path.join(CurriculumPaths.getCurriculumDir(), 'graphs-similarity.json');
    const indexPath = CurriculumPaths.getGraphsPath();
    
    // Check if file exists
    if (!fs.existsSync(indexPath)) {
      console.log('API: Graphs index file not found');
      return res.status(404).json({ 
        success: false, 
        error: 'Graphs index file not found' 
      });
    }
    
    // Read and parse the file
    const graphsData = await fs.promises.readFile(graphsPath, 'utf-8');
    const graphsIndex = JSON.parse(graphsData);
    
    console.log('API: Successfully read graphs index file');
    
    // Return the data
    return res.status(200).json({
      success: true,
      data: graphsIndex
    });
  } catch (error: any) {
    console.error('API Error:', error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
