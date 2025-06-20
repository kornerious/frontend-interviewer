/**
 * API endpoint for reading the graphs index file
 */
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('API: Reading graphs index file');
    
    // Define path to graphs.json
    const rootDir = process.cwd();
    const graphsPath = path.join(rootDir, 'graphs.json');
    
    // Check if file exists
    if (!fs.existsSync(graphsPath)) {
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
