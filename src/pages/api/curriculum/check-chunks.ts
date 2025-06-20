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
    // Check if clustering results exist in curriculum/results directory
    const resultsDir = path.join(process.cwd(), 'curriculum', 'results');
    const summaryPath = path.join(resultsDir, 'clustering-summary.json');
    
    // First check if the results directory exists
    const dirExists = fs.existsSync(resultsDir);
    // Then check if the summary file exists
    const summaryExists = dirExists && fs.existsSync(summaryPath);
    // Check if at least one chunk result file exists
    const hasResultFiles = dirExists && (
      fs.readdirSync(resultsDir)
        .filter(file => file.startsWith('chunk-') && file.endsWith('.json'))
        .length > 0
    );
    
    const exists = summaryExists && hasResultFiles;
    
    // Return result
    return res.status(200).json({ exists, summaryExists, hasResultFiles });
  } catch (error) {
    console.error('Error checking chunks:', error);
    return res.status(500).json({ error: 'Failed to check chunks' });
  }
}
