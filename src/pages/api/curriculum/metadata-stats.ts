import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint for getting metadata stats
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API: metadata-stats endpoint called');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if metadata.json exists
    const metadataPath = path.join(process.cwd(), 'metadata.json');
    console.log('API: Checking metadata file at', metadataPath);
    
    if (!fs.existsSync(metadataPath)) {
      console.log('API: Metadata file not found');
      return res.status(404).json({ error: 'Metadata file not found' });
    }
    
    // Read metadata.json
    console.log('API: Reading metadata file');
    const metadataContent = await fs.promises.readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    
    if (!metadata || !metadata.stats) {
      console.log('API: Invalid metadata format');
      return res.status(500).json({ error: 'Invalid metadata format' });
    }
    
    const stats = {
      theoryCount: metadata.stats.theoryCount || 0,
      questionCount: metadata.stats.questionCount || 0,
      taskCount: metadata.stats.taskCount || 0,
      totalItems: metadata.stats.totalItems || 0
    };
    
    console.log('API: Returning metadata stats:', stats);
    
    // Return stats
    return res.status(200).json(stats);
  } catch (error) {
    console.error('API: Error getting metadata stats:', error);
    return res.status(500).json({ error: 'Failed to get metadata stats' });
  }
}
