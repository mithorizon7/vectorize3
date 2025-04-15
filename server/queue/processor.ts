import { Job } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { 
  conversionQueue, 
  JobType, 
  ConversionJobPayload,
  BatchConversionJobPayload,
  ColorJobPayload,
  BackgroundJobPayload
} from './config';
import { convertImageToSVG } from '../conversion/svg-converter';
import { convertImageToColorSVG, detectColorComplexity } from '../conversion/color-tracer';
import { applySvgColor, setTransparentBackground } from '../conversion/svg-converter';
import { sanitizeSvgContent } from '../validation/inputValidation';

// Socket.io server instance - will be set when initializing the processor
let io: SocketIOServer | null = null;

// Set up the socket.io server
export function setSocketServer(socketServer: SocketIOServer) {
  io = socketServer;
}

// Utility to emit progress updates
function emitProgress(jobId: string, progress: number, status: string, result?: any) {
  if (io) {
    io.emit(`job:${jobId}:progress`, { jobId, progress, status, result });
  }
}

// Process single image conversion jobs
async function processConversionJob(job: Job<ConversionJobPayload>) {
  try {
    const { fileId, filePath, options } = job.data;
    
    // Emit progress update
    emitProgress(job.id.toString(), 10, 'Reading file...');
    
    // Verify the file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist at path: ${filePath}`);
    }
    
    // Read the file
    const fileBuffer = fs.readFileSync(filePath);
    emitProgress(job.id.toString(), 30, 'Analyzing image...');
    
    let result: string;
    
    // Auto-detect the best conversion method if requested
    if (options.traceEngine === 'auto') {
      // Update progress
      emitProgress(job.id.toString(), 40, 'Analyzing image colors...');
      
      // Analyze image colors
      const colorAnalysis = await detectColorComplexity(fileBuffer);
      
      // Choose engine based on color complexity
      if (colorAnalysis.isColorImage && colorAnalysis.distinctColors > 8) {
        emitProgress(job.id.toString(), 50, 'Converting color image...');
        result = await convertImageToColorSVG(fileBuffer, options);
      } else {
        emitProgress(job.id.toString(), 50, 'Converting black and white image...');
        result = await convertImageToSVG(fileBuffer, options);
      }
    } 
    // Use explicitly selected engine
    else if (options.traceEngine === 'imagetracer') {
      emitProgress(job.id.toString(), 50, 'Converting with color tracer...');
      result = await convertImageToColorSVG(fileBuffer, options);
    } 
    // Default to potrace
    else {
      emitProgress(job.id.toString(), 50, 'Converting with Potrace...');
      result = await convertImageToSVG(fileBuffer, options);
    }
    
    // Sanitize and validate the SVG
    emitProgress(job.id.toString(), 80, 'Sanitizing SVG...');
    const sanitizedSvg = sanitizeSvgContent(result);
    
    if (!sanitizedSvg || sanitizedSvg.length === 0) {
      throw new Error('SVG generation failed - empty result');
    }
    
    // Clean up the temp file
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }
    
    // Emit completion
    emitProgress(
      job.id.toString(), 
      100, 
      'Conversion complete',
      { svg: sanitizedSvg }
    );
    
    return { svg: sanitizedSvg };
  } catch (error) {
    console.error('Error in conversion job:', error);
    // Clean up temp file even on failure
    try {
      if (fs.existsSync(job.data.filePath)) {
        fs.unlinkSync(job.data.filePath);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp file after job failure:', cleanupError);
    }
    
    emitProgress(job.id.toString(), 100, 'Error', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

// Process batch conversion jobs
async function processBatchConversionJob(job: Job<BatchConversionJobPayload>) {
  try {
    const { files, options } = job.data;
    const results: { fileId: string; svg: string }[] = [];
    const totalFiles = files.length;
    
    // Emit initial progress
    emitProgress(job.id.toString(), 5, `Starting batch conversion of ${totalFiles} files...`);
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndex = i;
      
      // Update progress for this file
      emitProgress(
        job.id.toString(), 
        Math.floor(5 + (90 * (i / totalFiles))), 
        `Converting file ${i + 1} of ${totalFiles}: ${file.originalFilename || file.fileId}`
      );
      
      // Verify the file exists
      if (!fs.existsSync(file.filePath)) {
        console.error(`File does not exist at path: ${file.filePath}`);
        continue; // Skip this file but continue with others
      }
      
      try {
        // Read the file
        const fileBuffer = fs.readFileSync(file.filePath);
        
        // Determine which conversion method to use
        let result: string;
        if (options.traceEngine === 'auto') {
          const colorAnalysis = await detectColorComplexity(fileBuffer);
          if (colorAnalysis.isColorImage && colorAnalysis.distinctColors > 8) {
            result = await convertImageToColorSVG(fileBuffer, options);
          } else {
            result = await convertImageToSVG(fileBuffer, options);
          }
        } 
        else if (options.traceEngine === 'imagetracer') {
          result = await convertImageToColorSVG(fileBuffer, options);
        } 
        else {
          result = await convertImageToSVG(fileBuffer, options);
        }
        
        // Sanitize and add to results
        const sanitizedSvg = sanitizeSvgContent(result);
        if (sanitizedSvg && sanitizedSvg.length > 0) {
          results.push({
            fileId: file.fileId,
            svg: sanitizedSvg
          });
        }
        
        // Clean up the temp file
        try {
          fs.unlinkSync(file.filePath);
        } catch (cleanupError) {
          console.error('Error cleaning up temp file:', cleanupError);
        }
        
        // Emit partial result for this file
        io?.emit(`job:${job.id.toString()}:file:${fileIndex}`, {
          fileId: file.fileId,
          svg: sanitizedSvg,
          progress: 100
        });
        
      } catch (fileError) {
        console.error(`Error converting file ${file.originalFilename || file.fileId}:`, fileError);
        // Clean up the temp file even on failure
        try {
          if (fs.existsSync(file.filePath)) {
            fs.unlinkSync(file.filePath);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up temp file after failure:', cleanupError);
        }
        
        // Notify about this file's failure but continue with others
        io?.emit(`job:${job.id.toString()}:file:${fileIndex}`, {
          fileId: file.fileId,
          error: fileError instanceof Error ? fileError.message : 'Unknown error',
          progress: 100
        });
      }
    }
    
    // Emit final completion
    emitProgress(
      job.id.toString(), 
      100, 
      `Batch conversion complete. Converted ${results.length} of ${totalFiles} files.`,
      { results }
    );
    
    return { results };
  } catch (error) {
    console.error('Error in batch conversion job:', error);
    
    // Clean up all temp files even on failure
    for (const file of job.data.files) {
      try {
        if (fs.existsSync(file.filePath)) {
          fs.unlinkSync(file.filePath);
        }
      } catch (cleanupError) {
        console.error(`Error cleaning up temp file ${file.fileId} after job failure:`, cleanupError);
      }
    }
    
    emitProgress(job.id.toString(), 100, 'Error', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

// Process color application jobs
async function processColorJob(job: Job<ColorJobPayload>) {
  try {
    const { svgContent, color, jobId } = job.data;
    
    // Emit progress
    emitProgress(job.id.toString(), 30, 'Applying color...');
    
    // Apply the color
    const result = await applySvgColor(svgContent, color);
    
    // Sanitize the SVG
    emitProgress(job.id.toString(), 80, 'Sanitizing SVG...');
    const sanitizedSvg = sanitizeSvgContent(result);
    
    // Emit completion
    emitProgress(
      job.id.toString(), 
      100, 
      'Color applied successfully',
      { svg: sanitizedSvg }
    );
    
    return { svg: sanitizedSvg };
  } catch (error) {
    console.error('Error in color job:', error);
    emitProgress(job.id.toString(), 100, 'Error', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

// Process background transparency jobs
async function processBackgroundJob(job: Job<BackgroundJobPayload>) {
  try {
    const { svgContent, isTransparent, jobId } = job.data;
    
    // Emit progress
    emitProgress(job.id.toString(), 30, isTransparent ? 'Making background transparent...' : 'Setting white background...');
    
    // Set the background
    const result = await setTransparentBackground(svgContent, isTransparent);
    
    // Sanitize the SVG
    emitProgress(job.id.toString(), 80, 'Sanitizing SVG...');
    const sanitizedSvg = sanitizeSvgContent(result);
    
    // Emit completion
    emitProgress(
      job.id.toString(), 
      100, 
      isTransparent ? 'Background made transparent' : 'White background applied',
      { svg: sanitizedSvg }
    );
    
    return { svg: sanitizedSvg };
  } catch (error) {
    console.error('Error in background job:', error);
    emitProgress(job.id.toString(), 100, 'Error', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

// Initialize the job processors
export function initializeJobProcessors() {
  // Process individual image conversion
  conversionQueue.process(JobType.CONVERT_IMAGE, 2, processConversionJob);
  
  // Process batch conversion (limit to 1 at a time as it's resource intensive)
  conversionQueue.process(JobType.BATCH_CONVERT, 1, processBatchConversionJob);
  
  // Process color application (less resource intensive, can handle more)
  conversionQueue.process(JobType.APPLY_COLOR, 4, processColorJob);
  
  // Process background setting (less resource intensive, can handle more)
  conversionQueue.process(JobType.SET_BACKGROUND, 4, processBackgroundJob);
  
  console.log('Job processors initialized');
  
  // Run cleanup on startup
  cleanupStalledJobs().catch(err => {
    console.error('Error cleaning up stalled jobs:', err);
  });
}

// Function to add a new conversion job to the queue
export async function addConversionJob(payload: ConversionJobPayload) {
  const job = await conversionQueue.add(JobType.CONVERT_IMAGE, payload);
  return job;
}

// Function to add a batch conversion job to the queue
export async function addBatchConversionJob(payload: BatchConversionJobPayload) {
  const job = await conversionQueue.add(JobType.BATCH_CONVERT, payload);
  return job;
}

// Function to add a color application job to the queue
export async function addColorJob(payload: ColorJobPayload) {
  const job = await conversionQueue.add(JobType.APPLY_COLOR, payload);
  return job;
}

// Function to add a background setting job to the queue
export async function addBackgroundJob(payload: BackgroundJobPayload) {
  const job = await conversionQueue.add(JobType.SET_BACKGROUND, payload);
  return job;
}

// Function to clean up stalled jobs
async function cleanupStalledJobs() {
  try {
    await conversionQueue.clean(86400000, 'delayed'); // Clean delayed older than 24h
    await conversionQueue.clean(86400000, 'wait'); // Clean waiting older than 24h
    await conversionQueue.clean(86400000, 'active'); // Clean active older than 24h
    console.log('Stalled jobs cleaned up');
  } catch (error) {
    console.error('Error cleaning up stalled jobs:', error);
    throw error;
  }
}

// Export the cleanup function for use elsewhere
export { cleanupStalledJobs };