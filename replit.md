# Overview

This is an SVG image converter web application that transforms raster images (PNG, JPEG, GIF, etc.) into scalable vector graphics (SVG). The application uses a React frontend with Express.js backend, leveraging both Potrace and ImageTracer for different types of image conversions. Users can upload images, customize conversion settings, apply color modifications, and download the resulting SVG files.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript
- **UI Components**: Radix UI primitives with Tailwind CSS styling
- **State Management**: React hooks for local state, React Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **File Processing**: Sharp for image analysis and preprocessing
- **SVG Generation**: Dual-engine approach using Potrace (for B&W/simple images) and ImageTracer (for color images)
- **Queue System**: Bull queue with Redis for background job processing (optional)
- **File Handling**: Multer for secure file uploads with validation

## Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon serverless database adapter
- **Schema**: Tables for users, SVG conversion options, and conversion history
- **File Storage**: Temporary local file storage for processing

## Security and Performance
- **Rate Limiting**: Express-rate-limit for API protection
- **Security Headers**: Helmet middleware for enhanced security
- **File Validation**: MIME type checking and file size limits
- **Input Sanitization**: DOMPurify for SVG content cleaning
- **Logging**: Structured logging with anonymized IP addresses

## Conversion Engine Design
- **Auto-detection**: Smart algorithm to choose between Potrace and ImageTracer based on image complexity
- **Customizable Parameters**: Extensive options for both tracing engines including curve optimization, color quantization, and path simplification
- **Real-time Preview**: Live conversion updates when settings change
- **Batch Processing**: Support for processing multiple files simultaneously

# External Dependencies

## Core Processing Libraries
- **Sharp**: Image processing and analysis
- **Potrace**: Black and white bitmap tracing
- **ImageTracer**: Color image vectorization
- **JSDOM**: Server-side DOM manipulation for SVG processing

## Database and Caching
- **@neondatabase/serverless**: Serverless PostgreSQL connection
- **Drizzle ORM**: Type-safe database operations
- **Bull**: Background job queue management
- **Redis**: Queue storage and session management (optional)

## Frontend UI Libraries
- **@radix-ui/***: Accessible UI component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **React Query**: Server state management and caching
- **React Hook Form**: Form state management and validation

## Development and Security
- **Helmet**: Security headers middleware
- **Express-rate-limit**: API rate limiting
- **Multer**: File upload handling
- **DOMPurify**: XSS protection for SVG content