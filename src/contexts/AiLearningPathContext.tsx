"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface LearningPathNode {
  id: string;
  type: string;
  data: {
    courseId?: string;
    title: string;
    description?: string;
    estimatedWeeks?: number;
  };
  position: {
    x: number;
    y: number;
  };
}

interface LearningPathEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

interface AiGeneratedPath {
  title: string;
  description: string;
  estimatedDuration?: string;
  nodes: LearningPathNode[];
  edges: LearningPathEdge[];
  metadata?: {
    totalCourses: number;
    estimatedWeeks?: number;
  };
  taskId?: string;
}

interface AiLearningPathContextType {
  generatedPath: AiGeneratedPath | null;
  setGeneratedPath: (path: AiGeneratedPath | null) => void;
  clearGeneratedPath: () => void;
}

const AiLearningPathContext = createContext<AiLearningPathContextType | undefined>(undefined);

export function AiLearningPathProvider({ children }: { children: ReactNode }) {
  const [generatedPath, setGeneratedPath] = useState<AiGeneratedPath | null>(null);

  const clearGeneratedPath = () => {
    setGeneratedPath(null);
  };

  return (
    <AiLearningPathContext.Provider
      value={{
        generatedPath,
        setGeneratedPath,
        clearGeneratedPath,
      }}
    >
      {children}
    </AiLearningPathContext.Provider>
  );
}

export function useAiLearningPath() {
  const context = useContext(AiLearningPathContext);
  if (context === undefined) {
    throw new Error("useAiLearningPath must be used within AiLearningPathProvider");
  }
  return context;
}
