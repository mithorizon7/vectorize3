import Queue from 'bull';
import * as process from 'process';

// Redis connection configuration
const redisConfig = {
  redis: {
    port: parseInt(process.env.REDIS_PORT || '6379'),
    host: process.env.REDIS_HOST || 'localhost',
    // Use password if provided (for production environments)
    password: process.env.REDIS_PASSWORD,
    // Use TLS in production environments that require it
    tls: process.env.REDIS_TLS === 'true' ? { rejectUnauthorized: false } : undefined,
  },
  // Setting prefix to avoid conflicts with other applications using the same Redis instance
  prefix: 'svg-converter:',
  // Default job options
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs 3 times
    removeOnComplete: true, // Remove completed jobs to save Redis memory
    removeOnFail: false, // Keep failed jobs for debugging
    timeout: 300000, // 5 minutes timeout (SVG conversion can be resource-intensive)
    backoff: {
      type: 'exponential', // Exponential backoff for retries
      delay: 5000, // Initial delay before retry (5 seconds)
    },
  },
};

// Create and export the conversion queue
export const conversionQueue = new Queue('svg-conversion', redisConfig);

// Create and export the job types and statuses for type safety
export enum JobType {
  CONVERT_IMAGE = 'convert-image',
  BATCH_CONVERT = 'batch-convert',
  APPLY_COLOR = 'apply-color',
  SET_BACKGROUND = 'set-background',
}

export enum JobStatus {
  QUEUED = 'queued',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  FAILED = 'failed',
  DELAYED = 'delayed',
  PAUSED = 'paused',
}

// Job payload interfaces
export interface ConversionJobPayload {
  fileId: string; // Unique identifier for the file (temp file name)
  filePath: string; // Path to the temporary file
  options: any; // Conversion options
  originalFilename?: string; // Original file name for user display
  userId?: string; // Optional user ID for authentication scenarios
}

export interface BatchConversionJobPayload {
  files: {
    fileId: string;
    filePath: string;
    originalFilename?: string;
  }[];
  options: any;
  userId?: string;
}

export interface ColorJobPayload {
  svgContent: string;
  color: string;
  jobId: string;
}

export interface BackgroundJobPayload {
  svgContent: string;
  isTransparent: boolean;
  jobId: string;
}

// Function to clean up stalled jobs
export async function cleanupStalledJobs() {
  await conversionQueue.clean(86400000, 'delayed'); // Clean delayed older than 24h
  await conversionQueue.clean(86400000, 'wait'); // Clean waiting older than 24h
  await conversionQueue.clean(86400000, 'active'); // Clean active older than 24h
}

// Setup event listeners for the queue
conversionQueue.on('error', (error) => {
  console.error('Conversion queue error:', error);
});

conversionQueue.on('failed', (job, error) => {
  console.error(`Job ${job.id} failed:`, error);
});

conversionQueue.on('stalled', (job) => {
  console.warn(`Job ${job.id} stalled`);
});

// Setup Redis client events
conversionQueue.client.on('error', (error) => {
  console.error('Redis client error:', error);
});

conversionQueue.client.on('connect', () => {
  console.log('Redis client connected');
});

// Export Redis client for potential use elsewhere
export const redisClient = conversionQueue.client;