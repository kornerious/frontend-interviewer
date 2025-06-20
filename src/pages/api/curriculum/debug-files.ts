/**
 * Debug API endpoint to check what files exist
 */
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * Debug file existence
 * 
 * @param req NextApiRequest
 * @param res NextApiResponse
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const rootDir = process.cwd();
    
    // Check for various files
    const files = {
      'metadata.json': fs.existsSync(path.join(rootDir, 'metadata.json')),
      'graphs-dependency.json': fs.existsSync(path.join(rootDir, 'graphs-dependency.json')),
      'graphs-similarity.json': fs.existsSync(path.join(rootDir, 'graphs-similarity.json')),
      'scores.json': fs.existsSync(path.join(rootDir, 'scores.json')),
      'curriculum/metadata/metadata.json': fs.existsSync(path.join(rootDir, 'curriculum', 'metadata', 'metadata.json')),
      'curriculum/graphs/graphs.json': fs.existsSync(path.join(rootDir, 'curriculum', 'graphs', 'graphs.json')),
      'curriculum/scores/scores.json': fs.existsSync(path.join(rootDir, 'curriculum', 'scores', 'scores.json'))
    };
    
    // Return the file existence status
    return res.status(200).json({
      files,
      cwd: rootDir
    });
  } catch (error: any) {
    console.error('API Error:', error);
    
    return res.status(500).json({
      error: 'Failed to check file existence',
      message: error.message
    });
  }
}
