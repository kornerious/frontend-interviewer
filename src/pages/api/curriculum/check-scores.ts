/**
 * API endpoint to check if scores file exists
 */
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint for checking if scores.json exists
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
    const exists = fs.existsSync(scoresPath);
    
    // Return result
    return res.status(200).json({ exists });
  } catch (error) {
    console.error('Error checking scores:', error);
    return res.status(500).json({ error: 'Failed to check scores' });
  }
}
