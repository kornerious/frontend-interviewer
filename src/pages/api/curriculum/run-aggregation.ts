/**
 * API endpoint for aggregating AI-processed chunks and assembling the final curriculum
 * 
 * This endpoint:
 * 1. Merges AI-processed chunks
 * 2. Deduplicates items
 * 3. Resolves cross-chunk dependencies
 * 4. Optionally refines with AI
 * 5. Applies rule-based ordering within modules
 * 6. Interleaves related content
 * 7. Maps indexes back to full objects
 * 8. Generates final curriculum.json
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { CurriculumGenerator } from '@/curriculum';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('API: Starting curriculum aggregation and assembly');
    
    // Run the aggregation and assembly phase
    try {
      await CurriculumGenerator.aggregateAndAssemble();
      console.log('API: Curriculum aggregation and assembly completed successfully');
    } catch (innerError: any) {
      console.error('API: Detailed error in aggregateAndAssemble:', innerError);
      console.error('API: Error stack:', innerError.stack);
      throw innerError; // Re-throw to be caught by outer try/catch
    }
    
    return res.status(200).json({
      success: true,
      message: 'Curriculum aggregation and assembly completed successfully'
    });
  } catch (error: any) {
    console.error('API: Error during curriculum aggregation:', error);
    console.error('API: Error message:', error.message);
    console.error('API: Error stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during curriculum aggregation',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
