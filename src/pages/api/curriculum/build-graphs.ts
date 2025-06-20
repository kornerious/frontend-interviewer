/**
 * API endpoint for building dependency and similarity graphs
 */
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { CurriculumPaths } from '@/curriculum/utils/curriculumPaths';
import { GraphBuilder } from '../../../curriculum/graphs/graphBuilder';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('API: Starting graph building process');
    
    // Define paths
    const metadataPath = CurriculumPaths.getMetadataPath();
    const graphsPath = CurriculumPaths.getGraphsPath();
    
    // Create GraphBuilder instance
    const graphBuilder = new GraphBuilder(metadataPath, graphsPath);
    
    // Build graphs
    const result = await graphBuilder.buildGraphs();
    
    // Return success response with stats
    return res.status(200).json({
      success: true,
      stats: result.stats,
      graphsPath
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
