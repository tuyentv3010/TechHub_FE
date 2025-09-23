'use client';

import { motion } from 'framer-motion';

const technologies = [
  { name: 'React', logo: '⚛️', color: 'text-blue-400' },
  { name: 'Node.js', logo: '🟢', color: 'text-green-500' },
  { name: 'JavaScript', logo: '🟨', color: 'text-yellow-400' },
  { name: 'TypeScript', logo: '🔷', color: 'text-blue-600' },
  { name: 'Python', logo: '🐍', color: 'text-green-400' },
  { name: 'Java', logo: '☕', color: 'text-orange-500' },
  { name: 'Vue.js', logo: '💚', color: 'text-green-400' },
  { name: 'Angular', logo: '🅰️', color: 'text-red-500' },
  { name: 'PHP', logo: '🐘', color: 'text-purple-500' },
  { name: 'MongoDB', logo: '🍃', color: 'text-green-600' },
  { name: 'MySQL', logo: '🐬', color: 'text-blue-500' },
  { name: 'Docker', logo: '🐳', color: 'text-blue-400' },
];

export function TechnologyLogoLoop() {
  return (
    <div className="relative overflow-hidden py-8 bg-white/5 dark:bg-black/10 backdrop-blur-sm border-y border-white/10">
      <div className="relative">
        {/* Main scrolling track */}
        <motion.div
          className="flex space-x-8 will-change-transform"
          animate={{
            x: [0, -1920], // Move by width of all logos
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          {/* Duplicate the array to create seamless loop */}
          {[...technologies, ...technologies, ...technologies].map((tech, index) => (
            <motion.div
              key={`${tech.name}-${index}`}
              className="flex flex-col items-center justify-center min-w-[120px] group"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="w-16 h-16 flex items-center justify-center rounded-full bg-white/10 dark:bg-white/5 border border-white/20 shadow-lg group-hover:shadow-xl transition-all duration-300"
                whileHover={{
                  boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
                }}
              >
                <span className="text-3xl">{tech.logo}</span>
              </motion.div>
              <motion.span
                className={`mt-2 text-sm font-medium ${tech.color} opacity-70 group-hover:opacity-100 transition-opacity duration-300`}
                initial={{ opacity: 0.7 }}
                whileHover={{ opacity: 1 }}
              >
                {tech.name}
              </motion.span>
            </motion.div>
          ))}
        </motion.div>

        {/* Gradient overlays for fade effect */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white/20 to-transparent dark:from-black/20 pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white/20 to-transparent dark:from-black/20 pointer-events-none z-10" />
      </div>
      
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse delay-2000" />
      </div>
    </div>
  );
}

export function CompactTechnologyLoop() {
  const compactTechs = technologies.slice(0, 8);
  
  return (
    <div className="relative overflow-hidden py-4">
      <motion.div
        className="flex space-x-6"
        animate={{
          x: [0, -960],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {[...compactTechs, ...compactTechs].map((tech, index) => (
          <div
            key={`${tech.name}-${index}`}
            className="flex items-center space-x-2 min-w-[100px] bg-white/5 dark:bg-white/5 rounded-full px-3 py-2 border border-white/20"
          >
            <span className="text-lg">{tech.logo}</span>
            <span className={`text-xs font-medium ${tech.color} whitespace-nowrap`}>
              {tech.name}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}