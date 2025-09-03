import sharp from 'sharp';

/**
 * Shared image processing utility for consistent format handling
 * Processes and normalizes image buffers to PNG format for consistent tracing
 * Handles all major image formats and preserves transparency and color profiles
 */
export async function processImageBuffer(imageBuffer: Buffer, context: string = 'conversion'): Promise<{
  processedBuffer: Buffer;
  metadata: sharp.Metadata;
  format: string;
}> {
  try {
    console.log(`Processing image buffer with Sharp for ${context}...`);
    
    // Get image metadata to understand the input format
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    if (!metadata.format) {
      throw new Error('Unable to detect image format from buffer');
    }
    
    console.log("Input image metadata:", {
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      space: metadata.space,
      density: metadata.density,
      size: imageBuffer.length
    });
    
    // Validate image dimensions
    if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
      throw new Error(`Invalid image dimensions: ${metadata.width}x${metadata.height}`);
    }
    
    // Check for reasonable size limits (prevent memory issues)
    const maxDimension = 8192; // 8K max dimension
    if (metadata.width > maxDimension || metadata.height > maxDimension) {
      throw new Error(`Image too large: ${metadata.width}x${metadata.height}. Maximum allowed: ${maxDimension}x${maxDimension}`);
    }
    
    // Convert to PNG to ensure consistent format for tracers
    // PNG supports transparency and maintains color fidelity
    let processedImage = image.png({
      compressionLevel: 0, // No compression for better quality during processing
      adaptiveFiltering: false, // Faster processing
      force: true, // Force PNG output even if input is PNG
      palette: false, // Ensure full color depth
      progressive: false, // Standard PNG for better tracer compatibility
      quality: 100 // Maximum quality to preserve details
    });
    
    // Handle different color spaces and preserve color profiles
    if (metadata.space && metadata.space !== 'srgb') {
      console.log(`Converting from ${metadata.space} to sRGB color space for consistent processing`);
      try {
        processedImage = processedImage.toColorspace('srgb');
      } catch (colorSpaceError) {
        console.warn(`Failed to convert color space, using original: ${colorSpaceError}`);
        // Continue with original color space
      }
    }
    
    // Handle transparency properly - ensure all images can have transparency
    if (metadata.hasAlpha) {
      console.log("Preserving existing alpha channel for transparency");
      processedImage = processedImage.ensureAlpha();
    } else if (metadata.channels === 4) {
      // Image might have alpha channel without metadata indicating it
      console.log("Detected 4-channel image, ensuring alpha handling");
      processedImage = processedImage.ensureAlpha();
    } else {
      // For non-transparent formats (like JPEG), add alpha channel to enable transparency
      console.log(`Adding alpha channel to ${metadata.format} for transparency support`);
      processedImage = processedImage.ensureAlpha();
    }
    
    // Handle animated images (GIF) - extract first frame
    if (metadata.format === 'gif' && metadata.pages && metadata.pages > 1) {
      console.log(`Animated GIF detected with ${metadata.pages} frames, using first frame`);
      processedImage = processedImage.gif({ 
        loop: 0,
        delay: metadata.delay || [100]
      }).png();
    }
    
    // Handle multi-page images (TIFF) - extract first page
    if (metadata.format === 'tiff' && metadata.pages && metadata.pages > 1) {
      console.log(`Multi-page TIFF detected with ${metadata.pages} pages, using first page`);
    }
    
    // Get the processed buffer
    const processedBuffer = await processedImage.toBuffer();
    
    // Validate processed buffer
    if (processedBuffer.length === 0) {
      throw new Error('Image processing resulted in empty buffer');
    }
    
    console.log("Image processing complete:", {
      originalSize: imageBuffer.length,
      processedSize: processedBuffer.length,
      originalFormat: metadata.format,
      outputFormat: 'png',
      compressionRatio: Math.round((1 - processedBuffer.length / imageBuffer.length) * 100) + '%'
    });
    
    return {
      processedBuffer,
      metadata,
      format: metadata.format
    };
    
  } catch (error) {
    console.error("Error processing image buffer:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Input buffer contains unsupported image format')) {
        throw new Error(`Unsupported image format. Please use JPEG, PNG, GIF, BMP, TIFF, WebP, or SVG.`);
      } else if (error.message.includes('Input image exceeds pixel limit')) {
        throw new Error(`Image is too large. Please use an image smaller than 8192x8192 pixels.`);
      } else if (error.message.includes('premature end of data')) {
        throw new Error(`Image file appears to be corrupted or incomplete.`);
      }
      throw new Error(`Image processing failed: ${error.message}`);
    }
    
    throw new Error(`Image processing failed: Unknown error`);
  }
}

/**
 * Get basic image information without processing
 */
export async function getImageInfo(imageBuffer: Buffer): Promise<{
  format: string;
  width?: number;
  height?: number;
  channels?: number;
  hasAlpha?: boolean;
  space?: string;
  size: number;
}> {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    return {
      format: metadata.format || 'unknown',
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      space: metadata.space,
      size: imageBuffer.length
    };
  } catch (error) {
    console.error("Error getting image info:", error);
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}