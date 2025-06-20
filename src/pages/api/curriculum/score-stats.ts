import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint for getting score statistics
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if scores.json exists
    const scoresPath = path.join(process.cwd(), 'scores.json');
    
    if (!fs.existsSync(scoresPath)) {
      return res.status(404).json({
        error: 'Scores file not found',
        exists: false
      });
    }
    
    // Read the scores file
    const scoresData = JSON.parse(fs.readFileSync(scoresPath, 'utf-8'));
    
    // Count the number of items scored
    const itemsScored = Object.keys(scoresData).length;
    
    return res.status(200).json({
      itemsScored,
      scoresPath: 'scores.json',
      exists: true
    });
  } catch (error) {
    console.error('Error getting score stats:', error);
    return res.status(500).json({ error: 'Failed to get score statistics' });
  }
}
