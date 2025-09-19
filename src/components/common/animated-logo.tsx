'use client';

import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface AnimatedLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export function AnimatedLogo({ size = 'md', showText = true, className = '' }: AnimatedLogoProps) {
  const iconSizes = {
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <motion.div
      className={`flex items-center space-x-2 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.6,
        ease: "easeOut"
      }}
    >
      <motion.div
        animate={{ 
          rotate: [0, 5, -5, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "easeInOut"
        }}
      >
        <BookOpen className={`${iconSizes[size]} text-primary`} />
      </motion.div>
      
      {showText && (
        <motion.span
          className={`font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent ${textSizes[size]}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ 
            delay: 0.3,
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          TechHub
        </motion.span>
      )}
    </motion.div>
  );
}