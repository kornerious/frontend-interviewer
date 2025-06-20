/**
 * API endpoint for checking if graph files exist
 */
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { CurriculumPaths } from '@/curriculum/utils/curriculumPaths';

/**
 * API endpoint for checking if graph files exist
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if graphs files exist
    const graphsPath = path.join(CurriculumPaths.getCurriculumDir(), 'graphs-dependency.json');
    const exists = fs.existsSync(graphsPath);
    
    // Return result
    return res.status(200).json({ exists });
  } catch (error) {
    console.error('Error checking graphs:', error);
    return res.status(500).json({ error: 'Failed to check graphs' });
  }
}
