/**
 * API endpoint for calculating curriculum item scores
 */
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { ScoreCalculator } from '../../../curriculum/scoring/scoreCalculator';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('API: Starting score calculation process');
    
    // Define paths
    const rootDir = process.cwd();
    const metadataPath = path.join(rootDir, 'metadata.json');
    const graphsPath = path.join(rootDir, 'graphs.json');
    const scoresPath = path.join(rootDir, 'scores.json');
    
    // Create ScoreCalculator instance
    const scoreCalculator = new ScoreCalculator(metadataPath, graphsPath, scoresPath);
    
    // Calculate scores
    const scores = await scoreCalculator.calculateScores();
    
    // Return success response
    return res.status(200).json({
      success: true,
      itemsScored: Object.keys(scores).length,
      scoresPath
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
