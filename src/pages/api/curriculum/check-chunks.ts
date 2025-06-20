import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint for checking if AI-processed chunks exist
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check if chunks-processed.json exists
    const chunksPath = path.join(process.cwd(), 'chunks-processed.json');
    const exists = fs.existsSync(chunksPath);
    
    // Return result
    return res.status(200).json({ exists });
  } catch (error) {
    console.error('Error checking chunks:', error);
    return res.status(500).json({ error: 'Failed to check chunks' });
  }
}
