/**
 * API endpoint for processing database chunks with AI
 */
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import fs from 'fs';
import { CurriculumPaths } from '@/curriculum/utils/curriculumPaths';
import { AIClusteringService } from '@/curriculum/ai/aiClusteringService';

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
    console.log('API: Starting AI-assisted chunk processing at', new Date().toISOString());
    
    // Get API key from environment variables - try both server and client-side env vars
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    // Log environment variables (safely)
    console.log('API: Environment variables check:');
    console.log('- GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
    console.log('- NEXT_PUBLIC_GEMINI_API_KEY exists:', !!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
    console.log('- Using API key:', apiKey ? '****' + apiKey.substring(apiKey.length - 4) : 'undefined');
    
    if (!apiKey) {
      console.error('API: Missing Gemini API key in environment variables');
      return res.status(400).json({ 
        error: 'Gemini API key is required. Set NEXT_PUBLIC_GEMINI_API_KEY environment variable.' 
      });
    }
    
    // Get database path and check if it exists
    const databasePath = CurriculumPaths.getDatabasePath();
    const chunksOutputDir = CurriculumPaths.getChunksDir();
    const resultsOutputDir = path.join(CurriculumPaths.getCurriculumDir(), 'results');
    
    console.log('API: Paths configuration:');
    console.log('  - Database path:', databasePath);
    console.log('  - Chunks output directory:', chunksOutputDir);
    console.log('  - Results output directory:', resultsOutputDir);
    
    // Check if database file exists
    const databaseExists = fs.existsSync(databasePath);
    console.log('API: Database file exists:', databaseExists);
    
    if (!databaseExists) {
      console.error('API: Database file not found at', databasePath);
      return res.status(400).json({ 
        error: `Database file not found at ${databasePath}` 
      });
    }
    
    // Initialize service
    console.log('API: Initializing AIClusteringService');
    const clusteringService = new AIClusteringService({
      databasePath,
      chunksOutputDir,
      resultsOutputDir,
      apiKey,
      model: req.body.model || 'gemini-2.5-flash-preview-05-20'
    });
    
    // Run clustering process
    console.log('API: Starting clustering process');
    const result = await clusteringService.runClustering();
    console.log('API: Clustering process completed successfully');
    console.log('API: Result statistics:', {
      chunkCount: result.chunkCount,
      processedChunks: result.processedChunks,
      totalItems: result.totalItems,
      totalClusters: result.totalClusters
    });
    
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
