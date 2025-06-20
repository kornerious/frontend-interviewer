/**
 * API endpoint for processing database chunks with AI
 */
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import { AIClusteringService } from '../../../curriculum/ai/aiClusteringService';

/**
 * Process chunks with AI
 * 
 * @param req NextApiRequest
 * @param res NextApiResponse
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    console.log('API: Starting AI-assisted chunk processing');
    
    // Get API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(400).json({ 
        error: 'Gemini API key is required. Set NEXT_PUBLIC_GEMINI_API_KEY environment variable.' 
      });
    }
    
    // Set up paths
    const databasePath = path.join(process.cwd(), 'database.json');
    const chunksOutputDir = path.join(process.cwd(), 'curriculum', 'chunks');
    const resultsOutputDir = path.join(process.cwd(), 'curriculum', 'results');
    
    // Initialize service
    const clusteringService = new AIClusteringService({
      databasePath,
      chunksOutputDir,
      resultsOutputDir,
      apiKey,
      model: req.body.model || 'gemini-2.5-flash-preview-05-20'
    });
    
    // Run clustering process
    const result = await clusteringService.runClustering();
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'AI-assisted chunk processing completed successfully',
      stats: {
        chunkCount: result.chunkCount,
        processedChunks: result.processedChunks,
        totalItems: result.totalItems,
        totalClusters: result.totalClusters
      },
      outputDir: resultsOutputDir
    });
  } catch (error: any) {
    console.error('API Error:', error);
    
    return res.status(500).json({
      error: 'Failed to process chunks with AI',
      message: error.message
    });
  }
}
