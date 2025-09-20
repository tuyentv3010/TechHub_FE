'use client';

import { motion } from 'framer-motion';

export function LiquidGlassBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100 dark:from-gray-900 dark:via-violet-900/20 dark:to-indigo-900/30" />
      
      {/* Floating glass orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-violet-200/30 to-purple-300/30 rounded-full blur-3xl"
        animate={{
          x: [0, 100, -50, 0],
          y: [0, -80, 50, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute top-2/3 right-1/4 w-96 h-96 bg-gradient-to-r from-indigo-200/25 to-blue-300/25 rounded-full blur-3xl"
        animate={{
          x: [0, -120, 80, 0],
          y: [0, 60, -40, 0],
          scale: [1, 0.9, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      <motion.div
        className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-r from-purple-200/20 to-pink-300/20 rounded-full blur-3xl"
        animate={{
          x: [0, 150, -100, 0],
          y: [0, -70, 90, 0],
          scale: [1, 1.4, 0.7, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Liquid wave effects */}
      <motion.div
        className="absolute top-0 left-0 w-full h-full opacity-30"
        style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)'
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Glass morphism overlay */}
      <div className="absolute inset-0 bg-white/5 dark:bg-black/5 backdrop-blur-3xl" />
      
      {/* Mesh gradient overlay */}
      <div 
        className="absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          background: `
            radial-gradient(at 40% 20%, hsla(228,100%,74%,0.1) 0px, transparent 50%),
            radial-gradient(at 80% 0%, hsla(189,100%,56%,0.1) 0px, transparent 50%),
            radial-gradient(at 0% 50%, hsla(355,100%,93%,0.1) 0px, transparent 50%),
            radial-gradient(at 80% 50%, hsla(340,100%,76%,0.1) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsla(22,100%,77%,0.1) 0px, transparent 50%),
            radial-gradient(at 80% 100%, hsla(242,100%,70%,0.1) 0px, transparent 50%),
            radial-gradient(at 0% 0%, hsla(343,100%,76%,0.1) 0px, transparent 50%)
          `
        }}
      />
    </div>
  );
}

export function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`
      relative backdrop-blur-md bg-white/10 dark:bg-white/5 
      border border-white/20 dark:border-white/10 
      rounded-2xl shadow-2xl
      before:absolute before:inset-0 before:rounded-2xl 
      before:bg-gradient-to-br before:from-white/20 before:to-transparent 
      before:pointer-events-none
      ${className}
    `}>
      {children}
    </div>
  );
}