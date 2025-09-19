'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInTextProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeInText({ children, delay = 0, duration = 0.6, className = '' }: FadeInTextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay,
        duration,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface TypewriterTextProps {
  text: string;
  delay?: number;
  speed?: number;
  className?: string;
  showCursor?: boolean;
}

export function TypewriterText({ 
  text, 
  delay = 0, 
  speed = 0.05, 
  className = '',
  showCursor = true 
}: TypewriterTextProps) {
  const letters = Array.from(text);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: speed, delayChildren: delay }
    }
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 200
      }
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 200
      }
    }
  };

  return (
    <motion.div
      className={`inline-flex ${className}`}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {letters.map((letter, index) => (
        <motion.span
          variants={child}
          key={index}
          className={letter === ' ' ? 'w-2' : ''}
        >
          {letter === ' ' ? '\u00A0' : letter}
        </motion.span>
      ))}
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          className="ml-1 inline-block w-0.5 h-5 bg-primary"
        />
      )}
    </motion.div>
  );
}

interface SlideInTextProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideInText({ 
  children, 
  direction = 'left', 
  delay = 0, 
  duration = 0.6,
  className = '' 
}: SlideInTextProps) {
  const directionOffset = {
    left: { x: -50, y: 0 },
    right: { x: 50, y: 0 },
    up: { x: 0, y: -50 },
    down: { x: 0, y: 50 }
  };

  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        ...directionOffset[direction]
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0 
      }}
      transition={{ 
        delay,
        duration,
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  animate?: boolean;
}

export function GradientText({ children, className = '', animate = false }: GradientTextProps) {
  return (
    <motion.span
      className={`bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent ${className}`}
      animate={animate ? {
        backgroundPosition: ['0%', '100%', '0%']
      } : {}}
      transition={animate ? {
        duration: 3,
        repeat: Infinity,
        ease: "linear"
      } : {}}
      style={animate ? {
        backgroundSize: '200% 200%'
      } : {}}
    >
      {children}
    </motion.span>
  );
}