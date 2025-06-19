import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

/**
 * API endpoint for testing database.json access
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log('API: test-database endpoint called');
  
  try {
    // Get the absolute path to database.json
    const databasePath = path.join(process.cwd(), 'database.json');
    console.log('API: Database path:', databasePath);
    
    // Check if file exists
    const exists = fs.existsSync(databasePath);
    console.log('API: Database exists:', exists);
    
    if (!exists) {
      return res.status(404).json({ error: 'Database file not found' });
    }
    
    // Read the first few lines
    const stats = fs.statSync(databasePath);
    console.log('API: Database file size:', stats.size, 'bytes');
    
    // Read just the first 1000 bytes to verify access
    const buffer = Buffer.alloc(1000);
    const fd = fs.openSync(databasePath, 'r');
    fs.readSync(fd, buffer, 0, 1000, 0);
    fs.closeSync(fd);
    
    const sample = buffer.toString('utf-8');
    
    return res.status(200).json({ 
      success: true, 
      path: databasePath,
      size: stats.size,
      sample: sample.substring(0, 100) + '...' // Just return a small preview
    });
  } catch (error: any) {
    console.error('API: Error testing database access:', error);
    return res.status(500).json({ 
      error: 'Failed to access database', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
