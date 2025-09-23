'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GradientButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'purple' | 'pink';
  size?: 'sm' | 'md' | 'lg';
}

export function GradientButton({ 
  children, 
  className = '', 
  onClick, 
  disabled = false, 
  variant = 'primary',
  size = 'md',
  ...props 
}: GradientButtonProps) {
  const variants = {
    primary: 'from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:via-purple-700 hover:to-indigo-700',
    secondary: 'from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600',
    purple: 'from-purple-500 via-pink-500 to-rose-500 hover:from-purple-600 hover:via-pink-600 hover:to-rose-600',
    pink: 'from-pink-500 via-rose-500 to-red-500 hover:from-pink-600 hover:via-rose-600 hover:to-red-600',
  };

  const sizes = {
    sm: 'text-sm px-4 py-2',
    md: 'text-base px-6 py-3',
    lg: 'text-lg px-8 py-4',
  };

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className="relative overflow-hidden rounded-lg inline-block"
    >
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-r opacity-0 transition-opacity duration-300 hover:opacity-20',
          variants[variant]
        )}
      />
      <Button
        className={cn(
          'relative font-semibold text-white shadow-lg transition-all duration-300 w-full',
          `bg-gradient-to-r ${variants[variant]}`,
          sizes[size],
          'hover:shadow-xl hover:shadow-purple-500/25',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        <motion.div
          className="relative z-10 flex items-center space-x-2"
          animate={{ 
            textShadow: disabled ? 'none' : '0 0 20px rgba(147, 51, 234, 0.5)' 
          }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
        
        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: disabled ? '-100%' : '100%' }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
            repeatDelay: 1,
          }}
        />
      </Button>
    </motion.div>
  );
}

export function ShimmerButton({ 
  children, 
  className = '', 
  onClick, 
  disabled = false,
  ...props 
}: GradientButtonProps) {
  return (
    <motion.button
      className={cn(
        'relative inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 overflow-hidden',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 -top-2 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
        initial={{ x: '-100%' }}
        animate={{ x: disabled ? '-100%' : '100%' }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatDelay: 2,
          ease: 'easeInOut',
        }}
      />
      
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 blur-md opacity-30" />
    </motion.button>
  );
}