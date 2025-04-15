import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { 
  addConversionJob, 
  addBatchConversionJob,
  addColorJob,
  addBackgroundJob 
} from './processor';
import { conversionQueue, JobType } from './config';
import { sanitizeSvgContent } from '../validation/inputValidation';

// Controller for handling queue-related operations
export const queueController = {
  // Get job status
  async getJobStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      
      if (!jobId) {
        return res.status(400).json({ error: 'Job ID is required' });
      }
      
      const job = await conversionQueue.getJob(jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      
      const jobState = await job.getState();
      const jobProgress = await job.progress();
      
      return res.status(200).json({
        id: job.id,
        state: jobState,
        progress: jobProgress,
        data: job.data,
        result: job.returnvalue,
        failReason: job.failedReason,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      });
    } catch (error) {
      console.error('Error getting job status:', error);
      return res.status(500).json({ 
        error: 'Failed to get job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  // Queue a single image conversion
  async queueConversion(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No image file uploaded' });
      }
      
      // Use the temporary file
      const fileId = path.basename(req.file.path);
      
      // Apply user's options for conversion
      const options = {
        // Common options
        fileFormat: req.body.fileFormat || "svg",
        svgVersion: req.body.svgVersion || "1.1",
        drawStyle: req.body.drawStyle || "fillShapes",
        strokeWidth: parseFloat(req.body.strokeWidth) || 0.5,
        
        // Engine selection
        traceEngine: req.body.traceEngine || "auto", // potrace, imagetracer, or auto
        
        // Potrace specific options
        shapeStacking: req.body.shapeStacking || "placeCutouts",
        groupBy: req.body.groupBy || "none",
        lineFit: req.body.lineFit || "medium",
        allowedCurveTypes: req.body.allowedCurveTypes?.split(',') || ["lines", "quadraticBezier", "cubicBezier"],
        fillGaps: req.body.fillGaps === 'true',
        clipOverflow: req.body.clipOverflow === 'true',
        nonScalingStroke: req.body.nonScalingStroke === 'true',
        
        // ImageTracerJS specific options
        numberOfColors: parseInt(req.body.numberOfColors || "16"),
        colorMode: (req.body.colorMode || "color") as 'color' | 'grayscale',
        minColorRatio: parseFloat(req.body.minColorRatio || "0.02"),
        colorQuantization: (req.body.colorQuantization || "default") as 'default' | 'riemersma' | 'floyd-steinberg',
        blurRadius: parseInt(req.body.blurRadius || "0"),
        preserveColors: req.body.preserveColors === 'true'
      };
      
      // Add the job to the queue
      const job = await addConversionJob({
        fileId,
        filePath: req.file.path,
        originalFilename: req.file.originalname,
        options
      });
      
      return res.status(202).json({
        jobId: job.id,
        message: 'Conversion job queued successfully. Use WebSockets to track progress.',
        status: 'queued'
      });
    } catch (error) {
      console.error('Error queueing conversion:', error);
      
      // Clean up the temp file on error
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up temp file on error:', cleanupError);
        }
      }
      
      return res.status(500).json({ 
        error: 'Failed to queue conversion',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  // Queue a batch conversion
  async queueBatchConversion(req: Request, res: Response) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: 'No image files uploaded' });
      }
      
      // Process all uploaded files
      const files = req.files.map(file => ({
        fileId: path.basename(file.path),
        filePath: file.path,
        originalFilename: file.originalname
      }));
      
      // Apply user's options for conversion
      const options = {
        // Common options
        fileFormat: req.body.fileFormat || "svg",
        svgVersion: req.body.svgVersion || "1.1",
        drawStyle: req.body.drawStyle || "fillShapes",
        strokeWidth: parseFloat(req.body.strokeWidth) || 0.5,
        
        // Engine selection
        traceEngine: req.body.traceEngine || "auto", // potrace, imagetracer, or auto
        
        // Potrace specific options
        shapeStacking: req.body.shapeStacking || "placeCutouts",
        groupBy: req.body.groupBy || "none",
        lineFit: req.body.lineFit || "medium",
        allowedCurveTypes: req.body.allowedCurveTypes?.split(',') || ["lines", "quadraticBezier", "cubicBezier"],
        fillGaps: req.body.fillGaps === 'true',
        clipOverflow: req.body.clipOverflow === 'true',
        nonScalingStroke: req.body.nonScalingStroke === 'true',
        
        // ImageTracerJS specific options
        numberOfColors: parseInt(req.body.numberOfColors || "16"),
        colorMode: (req.body.colorMode || "color") as 'color' | 'grayscale',
        minColorRatio: parseFloat(req.body.minColorRatio || "0.02"),
        colorQuantization: (req.body.colorQuantization || "default") as 'default' | 'riemersma' | 'floyd-steinberg',
        blurRadius: parseInt(req.body.blurRadius || "0"),
        preserveColors: req.body.preserveColors === 'true'
      };
      
      // Add the batch job to the queue
      const job = await addBatchConversionJob({
        files,
        options
      });
      
      return res.status(202).json({
        jobId: job.id,
        message: `Batch conversion of ${files.length} files queued successfully. Use WebSockets to track progress.`,
        status: 'queued',
        fileCount: files.length
      });
    } catch (error) {
      console.error('Error queueing batch conversion:', error);
      
      // Clean up the temp files on error
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
            } catch (cleanupError) {
              console.error(`Error cleaning up temp file ${file.path} on error:`, cleanupError);
            }
          }
        }
      }
      
      return res.status(500).json({ 
        error: 'Failed to queue batch conversion',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  // Queue color application
  async queueColorApplication(req: Request, res: Response) {
    try {
      const { svg, color } = req.body;
      
      if (!svg || !color) {
        return res.status(400).json({ error: 'SVG content and color are required' });
      }
      
      // Generate a unique job ID
      const jobId = uuidv4();
      
      // Add the job to the queue
      const job = await addColorJob({
        svgContent: svg,
        color,
        jobId
      });
      
      return res.status(202).json({
        jobId: job.id,
        message: 'Color application job queued successfully. Use WebSockets to track progress.',
        status: 'queued'
      });
    } catch (error) {
      console.error('Error queueing color application:', error);
      return res.status(500).json({ 
        error: 'Failed to queue color application',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  },
  
  // Queue background transparency setting
  async queueBackgroundSetting(req: Request, res: Response) {
    try {
      const { svg, isTransparent } = req.body;
      
      if (!svg || isTransparent === undefined) {
        return res.status(400).json({ error: 'SVG content and isTransparent flag are required' });
      }
      
      // Generate a unique job ID
      const jobId = uuidv4();
      
      // Add the job to the queue
      const job = await addBackgroundJob({
        svgContent: svg,
        isTransparent: isTransparent === true || isTransparent === 'true',
        jobId
      });
      
      return res.status(202).json({
        jobId: job.id,
        message: 'Background setting job queued successfully. Use WebSockets to track progress.',
        status: 'queued'
      });
    } catch (error) {
      console.error('Error queueing background setting:', error);
      return res.status(500).json({ 
        error: 'Failed to queue background setting',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
};