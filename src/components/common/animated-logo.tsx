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
          rotate: [0, 360],
          scale: [1, 1.2, 1],
          filter: ['hue-rotate(0deg)', 'hue-rotate(180deg)', 'hue-rotate(360deg)']
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="relative"
      >
        <motion.div
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(139, 92, 246, 0)',
              '0 0 0 10px rgba(139, 92, 246, 0.3)',
              '0 0 0 20px rgba(139, 92, 246, 0)',
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeOut"
          }}
          className="absolute inset-0 rounded-full"
        />
        <BookOpen className={`${iconSizes[size]} text-violet-600 relative z-10`} />
      </motion.div>
      
      {showText && (
        <motion.span
          className={`font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent ${textSizes[size]}`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ 
            opacity: 1, 
            x: 0,
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{ 
            delay: 0.3,
            duration: 0.5,
            ease: "easeOut",
            backgroundPosition: {
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }
          }}
          style={{
            backgroundSize: '200% 200%',
          }}
        >
          TechHub
        </motion.span>
      )}
    </motion.div>
  );
}