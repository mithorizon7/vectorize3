import React from "react";
import { motion } from "framer-motion";

interface LoadingAnimationProps {
  conversionStatus: {
    status: "idle" | "loading" | "success" | "error";
    message: string;
  };
}

export default function LoadingAnimation({ conversionStatus }: LoadingAnimationProps) {
  const isLoading = conversionStatus.status === "loading";
  
  // SVG animation variants
  const svgVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 1,
        staggerChildren: 0.2
      }
    }
  };
  
  // Line drawing animation
  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };
  
  // Dots animation
  const dotsVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        repeat: Infinity,
        repeatDelay: 0.5,
        duration: 0.5
      }
    }
  };
  
  const dotVariants = {
    hidden: { 
      y: 0,
      opacity: 0.2
    },
    visible: { 
      y: [0, -10, 0],
      opacity: 1,
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  if (!isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center my-8">
      <div className="w-32 h-32 relative">
        {/* Abstract SVG shape representing image-to-SVG conversion */}
        <motion.svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          initial="hidden"
          animate="visible"
          variants={svgVariants}
        >
          {/* Original "photo" frame */}
          <motion.rect
            x="20"
            y="20"
            width="60"
            height="60"
            rx="2"
            fill="none"
            stroke="rgba(59, 130, 246, 0.6)"
            strokeWidth="2"
            variants={pathVariants}
          />
          
          {/* Vector lines representing SVG conversion */}
          <motion.path
            d="M 30 50 Q 40 30, 50 50 T 70 50"
            fill="none"
            stroke="rgba(59, 130, 246, 0.8)"
            strokeWidth="2"
            strokeLinecap="round"
            variants={pathVariants}
          />
          
          <motion.circle
            cx="60"
            cy="40"
            r="5"
            fill="none"
            stroke="rgba(59, 130, 246, 0.7)"
            strokeWidth="2"
            variants={pathVariants}
          />
          
          {/* SVG target shape */}
          <motion.path
            d="M25,25 L75,25 L75,75 L25,75 Z"
            fill="none"
            stroke="rgba(59, 130, 246, 0.5)"
            strokeWidth="1"
            strokeDasharray="2 2"
            variants={pathVariants}
            style={{ pathLength: 1 }}
          />
          
          {/* Abstract nodes */}
          <motion.circle
            cx="30"
            cy="30"
            r="3"
            fill="rgba(59, 130, 246, 0.8)"
            variants={pathVariants}
          />
          <motion.circle
            cx="70"
            cy="30"
            r="3"
            fill="rgba(59, 130, 246, 0.8)"
            variants={pathVariants}
          />
          <motion.circle
            cx="70"
            cy="70"
            r="3"
            fill="rgba(59, 130, 246, 0.8)"
            variants={pathVariants}
          />
          <motion.circle
            cx="30"
            cy="70"
            r="3"
            fill="rgba(59, 130, 246, 0.8)"
            variants={pathVariants}
          />
        </motion.svg>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <p className="text-lg font-medium text-blue-600 mb-2">
          {conversionStatus.message || "Converting image to SVG..."}
        </p>
        
        <motion.div 
          className="flex space-x-2 mt-2"
          variants={dotsVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={dotVariants} className="w-2 h-2 bg-blue-600 rounded-full" />
          <motion.div variants={dotVariants} className="w-2 h-2 bg-blue-600 rounded-full" />
          <motion.div variants={dotVariants} className="w-2 h-2 bg-blue-600 rounded-full" />
        </motion.div>
        
        <p className="text-sm text-gray-500 mt-4 max-w-md text-center">
          Analyzing image, detecting edges, paths, and color regions...
          Optimizing SVG output for quality and file size.
        </p>
      </div>
    </div>
  );
}