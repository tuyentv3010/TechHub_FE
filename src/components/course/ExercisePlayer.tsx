"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  Play, 
  Star, 
  Clock, 
  Volume2, 
  Music, 
  ChevronRight,
  X,
  Maximize2,
  HelpCircle,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

// Types
interface Choice {
  text: string;
  isCorrect: boolean;
}

interface Exercise {
  id: string;
  type: "MULTIPLE_CHOICE" | "CODING" | "OPEN_ENDED";
  question: string;
  options?: string;
  testCases?: any[];
}

interface ExercisePlayerProps {
  exercises: Exercise[];
  lessonTitle?: string;
  userAvatar?: string;
  onComplete?: (results: ExerciseResult[]) => void;
  onClose?: () => void;
}

interface ExerciseResult {
  exerciseId: string;
  isCorrect: boolean;
  selectedAnswers: string[];
  timeSpent: number;
}

// Parse choices from exercise options
const parseChoices = (options: string | undefined): Choice[] => {
  if (!options) return [];
  try {
    const parsed = typeof options === 'string' ? JSON.parse(options) : options;
    return parsed.choices || [];
  } catch {
    return [];
  }
};

// Start Screen Component
function ExerciseStartScreen({ 
  exerciseCount, 
  lessonTitle, 
  onStart 
}: { 
  exerciseCount: number; 
  lessonTitle?: string; 
  onStart: () => void;
}) {
  return (
    <div 
      className="relative w-full min-h-[500px] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: '#FFF8DD' }}
    >
      {/* Decorative Elements */}
      <div className="absolute top-4 left-4">
        <div className="w-8 h-8 text-[#7BC74D]">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
          </svg>
        </div>
      </div>
      <div className="absolute top-8 right-8">
        <div className="w-6 h-6 text-[#FF6B6B]">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
          </svg>
        </div>
      </div>
      <div className="absolute bottom-16 left-8">
        <div className="w-5 h-5 text-[#4ECDC4]">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
          </svg>
        </div>
      </div>
      <div className="absolute bottom-20 right-12">
        <div className="w-4 h-4 text-[#F7B731]">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
          </svg>
        </div>
      </div>
      
      {/* Music notes decoration */}
      <div className="absolute top-12 left-1/4 opacity-20">
        <Music className="w-8 h-8 text-gray-400" />
      </div>
      <div className="absolute bottom-24 right-1/4 opacity-20">
        <Music className="w-6 h-6 text-gray-400" />
      </div>

      {/* Main Illustration Area */}
      <div className="relative mb-8">
        {/* Universe/Space themed illustration placeholder */}
        <div 
          className="w-80 h-56 rounded-[40%_60%_55%_45%/50%_40%_60%_50%] flex items-center justify-center relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #1a1a4e 0%, #2d2d7a 50%, #1a1a4e 100%)',
            boxShadow: '0 20px 60px rgba(26, 26, 78, 0.3)'
          }}
        >
          {/* Stars */}
          <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          
          {/* Planets */}
          <div className="absolute w-6 h-6 bg-yellow-400 rounded-full top-8 left-12 shadow-lg" />
          <div className="absolute w-4 h-4 bg-orange-500 rounded-full top-16 right-16 shadow-lg" />
          <div className="absolute w-5 h-5 bg-blue-400 rounded-full bottom-12 left-20 shadow-lg" />
          <div className="absolute w-8 h-8 bg-amber-200 rounded-full bottom-8 right-8 shadow-lg">
            <div className="absolute inset-1 border-2 border-amber-400/50 rounded-full" />
          </div>
          
          {/* Orbit rings */}
          <div className="absolute w-40 h-40 border border-white/20 rounded-full" />
          <div className="absolute w-56 h-32 border border-white/10 rounded-full" />
          
          {/* Central Play Button */}
          <button
            onClick={onStart}
            className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110 group"
          >
            <Play className="w-8 h-8 text-white fill-white ml-1 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        {/* Book illustration at bottom */}
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
          <div className="w-24 h-12 bg-gradient-to-b from-gray-100 to-gray-200 rounded-t-sm shadow-lg relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-blue-300" />
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300" />
          </div>
        </div>
      </div>

      {/* Info Text */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {lessonTitle || "Bài tập thực hành"}
        </h2>
        <p className="text-gray-600">
          {exerciseCount} câu hỏi • Nhấn play để bắt đầu
        </p>
      </div>

      {/* Start Button */}
      <button
        onClick={onStart}
        className="px-8 py-3 bg-[#4A90D9] hover:bg-[#3A7BC8] text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 flex items-center gap-2"
      >
        <Play className="w-5 h-5 fill-white" />
        Bắt đầu làm bài
      </button>
    </div>
  );
}

// Kahoot-style answer colors
const ANSWER_COLORS = [
  { bg: 'bg-[#C5A900]', hover: 'hover:bg-[#A38900]', gradient: 'from-[#C5A900] to-[#9A7D00]' }, // Yellow/Gold
  { bg: 'bg-[#9B59B6]', hover: 'hover:bg-[#8E44AD]', gradient: 'from-[#9B59B6] to-[#7D3C98]' }, // Purple
  { bg: 'bg-[#E67E22]', hover: 'hover:bg-[#D35400]', gradient: 'from-[#E67E22] to-[#C56A00]' }, // Orange
  { bg: 'bg-[#1ABC9C]', hover: 'hover:bg-[#16A085]', gradient: 'from-[#1ABC9C] to-[#138D75]' }, // Teal
];

const TIME_LIMIT = 10; // 10 seconds per question
const SHOW_ANSWER_DURATION = 5; // 5 seconds to show answer

// Question Screen Component
function QuestionScreen({
  exercise,
  questionNumber,
  totalQuestions,
  countdown,
  onAnswer,
  onShowHelp,
  onNextQuestion,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
  onFullscreen,
  onClose,
  submitted,
  selectedAnswers,
  isCorrect,
  showAnswerCountdown,
  userAvatar,
  lessonTitle,
}: {
  exercise: Exercise;
  questionNumber: number;
  totalQuestions: number;
  countdown: number;
  onAnswer: (answers: string[]) => void;
  onShowHelp: () => void;
  onNextQuestion: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onFullscreen: () => void;
  onClose: () => void;
  submitted: boolean;
  selectedAnswers: string[];
  isCorrect: boolean;
  showAnswerCountdown: number;
  userAvatar?: string;
  lessonTitle?: string;
}) {
  const choices = parseChoices(exercise.options);
  const correctCount = choices.filter(c => c.isCorrect).length;
  const isMultipleChoice = correctCount > 1;
  
  // Local state for multiple choice selection
  const [localSelected, setLocalSelected] = useState<string[]>([]);

  // Reset local selection when question changes
  useEffect(() => {
    setLocalSelected([]);
  }, [exercise.id]);

  // Handle choice selection
  const handleChoiceClick = (index: number) => {
    if (submitted) return;
    
    const indexStr = index.toString();
    
    if (isMultipleChoice) {
      // Multiple choice: toggle selection
      let newSelected: string[];
      if (localSelected.includes(indexStr)) {
        // Deselect
        newSelected = localSelected.filter(i => i !== indexStr);
        setLocalSelected(newSelected);
      } else {
        // Select - add to list
        newSelected = [...localSelected, indexStr];
        setLocalSelected(newSelected);
        
        // Auto submit when selected enough answers
        if (newSelected.length === correctCount) {
          onAnswer(newSelected);
        }
      }
    } else {
      // Single choice: auto submit immediately
      onAnswer([indexStr]);
    }
  };

  // Get display selected answers (use local for multiple choice before submit)
  const displaySelected = isMultipleChoice && !submitted ? localSelected : selectedAnswers;

  // Determine if time ran out (no answer selected and countdown is 0)
  const timedOut = submitted && selectedAnswers.length === 0;

  return (
    <div className="relative w-full min-h-[600px] rounded-2xl overflow-hidden" style={{ backgroundColor: '#0A5CAC' }}>
      {/* Header with Avatar, Progress Stars, and Title */}
      <div className="relative px-4 py-3" style={{ backgroundColor: '#FDDF2F' }}>
        <div className="flex items-center justify-between gap-4">
          {/* Left: Question number indicator */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow">
              <span className="text-sm font-bold text-gray-700">#{questionNumber}</span>
            </div>
          </div>

          {/* Center: Avatar + Progress Stars Bar */}
          <div className="flex-1 flex items-center gap-3">
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden shadow-md flex-shrink-0">
              <img 
                src={userAvatar || "/avatars/default-avatar.png"}
                alt="Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23666"><circle cx="12" cy="8" r="4"/><path d="M12 14c-6 0-8 3-8 6v2h16v-2c0-3-2-6-8-6z"/></svg>';
                }}
              />
            </div>
            
            {/* Progress Stars Bar */}
            <div className="flex-1 flex items-center">
              {/* Stars with connecting line */}
              <div className="relative flex items-center w-full">
                {/* Background line */}
                <div className="absolute left-0 right-0 h-1 bg-gray-400/50 rounded-full" />
                
                {/* Progress line (completed) */}
                <div 
                  className="absolute left-0 h-1 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${((questionNumber - 1) / (totalQuestions - 1)) * 100}%`,
                    background: 'linear-gradient(90deg, #0A5CAC, #0A5CAC)'
                  }}
                />
                
                {/* Stars */}
                <div className="relative flex items-center justify-between w-full">
                  {[...Array(totalQuestions)].map((_, i) => {
                    const isCompleted = i < questionNumber - 1;
                    const isCurrent = i === questionNumber - 1;
                    const isPending = i > questionNumber - 1;
                    
                    return (
                      <div key={i} className="relative z-10">
                        <Star
                          className={cn(
                            "w-6 h-6 transition-all duration-300 drop-shadow-md",
                            isCompleted && "text-[#0A5CAC] fill-[#0A5CAC]",
                            isCurrent && "text-[#FDDF2F] fill-[#FDDF2F] scale-125 drop-shadow-lg",
                            isPending && "text-white fill-white/50"
                          )}
                          style={{
                            filter: isCurrent ? 'drop-shadow(0 0 8px rgba(253, 223, 47, 0.8))' : undefined
                          }}
                        />
                        {isCurrent && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#FDDF2F] rounded-full animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Title */}
          <div className="text-right flex-shrink-0">
            <h1 className="text-base md:text-lg font-bold text-gray-800 leading-tight">
              {lessonTitle || `Câu hỏi ${questionNumber}`}
            </h1>
          </div>
        </div>

        {/* Countdown Timer - Inside header on right */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition-all",
            submitted 
              ? "bg-[#0A5CAC] text-white" 
              : countdown <= 3 
                ? "bg-red-500 text-white animate-pulse" 
                : "bg-white text-gray-800"
          )}>
            {submitted ? showAnswerCountdown : countdown}
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="pt-6 px-4 md:px-8">
        <div className="bg-gray-900/80 rounded-xl p-4 md:p-6 mb-6 max-w-3xl mx-auto">
          <h2 className="text-lg md:text-2xl font-bold text-white text-center">
            {exercise.question}
          </h2>
          {isMultipleChoice && !submitted && (
            <p className="text-sm text-blue-300 mt-2 text-center">
              (Chọn {correctCount} đáp án đúng)
            </p>
          )}
        </div>
      </div>

      {/* Kahoot-style Answer Grid */}
      <div className="px-4 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {choices.map((choice, index) => {
            const isSelected = displaySelected.includes(index.toString());
            const colorScheme = ANSWER_COLORS[index % ANSWER_COLORS.length];
            
            // Determine styling based on state
            let extraClasses = '';
            let showIcon = null;
            
            if (submitted) {
              if (choice.isCorrect) {
                extraClasses = 'ring-4 ring-white ring-offset-2 ring-offset-transparent scale-105';
                showIcon = <CheckCircle2 className="w-8 h-8 text-white" />;
              } else if (isSelected && !choice.isCorrect) {
                extraClasses = 'opacity-60';
                showIcon = <XCircle className="w-8 h-8 text-white" />;
              } else if (timedOut) {
                extraClasses = 'opacity-40';
              } else {
                extraClasses = 'opacity-40';
              }
            } else if (isSelected && isMultipleChoice) {
              // Show selection state for multiple choice before submit
              extraClasses = 'ring-4 ring-white ring-offset-2 ring-offset-transparent';
            }

            return (
              <button
                key={index}
                onClick={() => handleChoiceClick(index)}
                disabled={submitted}
                className={cn(
                  "relative min-h-[140px] md:min-h-[180px] rounded-lg flex flex-col items-center justify-center p-4 transition-all duration-300",
                  colorScheme.bg,
                  !submitted && colorScheme.hover,
                  !submitted && "cursor-pointer hover:scale-105 hover:shadow-xl active:scale-95",
                  submitted && "cursor-default",
                  extraClasses
                )}
              >
                {/* Selection indicator for multiple choice */}
                {!submitted && isMultipleChoice && isSelected && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-8 h-8 text-white" />
                  </div>
                )}
                
                {/* Icon indicator after submit */}
                {submitted && showIcon && (
                  <div className="absolute top-3 right-3">
                    {showIcon}
                  </div>
                )}
                
                {/* Answer text */}
                <span className="text-white font-bold text-lg md:text-xl text-center leading-tight">
                  {choice.text}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Selection indicator for multiple choice */}
        {isMultipleChoice && !submitted && (
          <div className="flex justify-center mt-4">
            <div className="bg-gray-800/80 text-white px-4 py-2 rounded-full text-sm font-medium">
              Đã chọn {localSelected.length}/{correctCount} đáp án
            </div>
          </div>
        )}
      </div>

      {/* Result message after submit */}
      {submitted && (
        <div className="px-8 pb-6">
          <div className={cn(
            "max-w-xl mx-auto p-4 rounded-xl text-center",
            timedOut ? "bg-yellow-500/20" : isCorrect ? "bg-green-500/20" : "bg-red-500/20"
          )}>
            <div className="flex items-center justify-center gap-2 mb-2">
              {timedOut ? (
                <>
                  <Clock className="w-6 h-6 text-yellow-400" />
                  <span className="text-lg font-bold text-yellow-400">Hết thời gian!</span>
                </>
              ) : isCorrect ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <span className="text-lg font-bold text-green-400">Chính xác!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-400" />
                  <span className="text-lg font-bold text-red-400">Chưa chính xác</span>
                </>
              )}
            </div>
            {(!isCorrect || timedOut) && (
              <p className="text-sm text-gray-300">
                Đáp án đúng: {choices.filter(c => c.isCorrect).map(c => c.text).join(", ")}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Tự động chuyển sau {showAnswerCountdown}s...
            </p>
          </div>
        </div>
      )}

      {/* Fullscreen button */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={onFullscreen}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <Maximize2 className="w-6 h-6 text-white/60" />
        </button>
      </div>

      {/* Help mascot */}
      <div className="absolute bottom-4 left-4">
        <button
          onClick={onShowHelp}
          className="relative group"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <span className="text-2xl">🦜</span>
          </div>
        </button>
      </div>
    </div>
  );
}// Help Modal Component
function HelpModal({
  isOpen,
  onClose,
  helpItems,
}: {
  isOpen: boolean;
  onClose: () => void;
  helpItems: { title: string; description: string; type: 'text' | 'image' | 'video' | 'audio' }[];
}) {
  if (!isOpen) return null;

  const defaultHelps = [
    { title: "Trợ giúp 1", description: "Đây là gợi ý dạng văn bản", type: "text" as const },
    { title: "Trợ giúp 2", description: "Đây là gợi ý dạng hình ảnh", type: "image" as const },
    { title: "Trợ giúp 3", description: "Đây là gợi ý dạng video", type: "video" as const },
    { title: "Trợ giúp 4", description: "Đây là gợi ý dạng âm thanh", type: "audio" as const },
  ];

  const items = helpItems.length > 0 ? helpItems : defaultHelps;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl rounded-2xl p-8 max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: '#FFF8DD' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Decorative elements */}
        <div className="absolute top-20 left-8">
          <div className="w-8 h-8 text-[#FF6B6B]">
            <X className="w-full h-full" strokeWidth={3} />
          </div>
        </div>
        <div className="absolute top-1/2 left-4">
          <div className="w-6 h-6 text-[#FF6B6B]">
            <X className="w-full h-full" strokeWidth={3} />
          </div>
        </div>

        {/* Help cards grid */}
        <div className="grid grid-cols-2 gap-4 mt-16">
          {items.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Side buttons */}
        <div className="absolute right-4 top-24 flex flex-col gap-2">
          <button className="w-12 h-12 rounded-xl bg-[#FDDF2F] shadow-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-gray-700" />
          </button>
          <button className="w-12 h-12 rounded-xl bg-[#4A90D9] shadow-lg flex items-center justify-center text-white">
            <Volume2 className="w-6 h-6" />
          </button>
          <button className="w-12 h-12 rounded-xl bg-[#4A90D9] shadow-lg flex items-center justify-center text-white">
            <Music className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Result Screen Component
function ResultScreen({
  results,
  totalTime,
  onRetry,
  onClose,
}: {
  results: ExerciseResult[];
  totalTime: number;
  onRetry: () => void;
  onClose: () => void;
}) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = results.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  // Trigger confetti for good results
  useEffect(() => {
    if (percentage >= 70) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [percentage]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} phút ${secs} giây`;
  };

  return (
    <div 
      className="relative w-full min-h-[500px] rounded-2xl overflow-hidden flex flex-col items-center justify-center p-8"
      style={{ backgroundColor: '#FFF8DD' }}
    >
      {/* Decorative elements */}
      <div className="absolute top-8 left-8">
        <div className="w-8 h-8 text-[#7BC74D]">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
          </svg>
        </div>
      </div>
      <div className="absolute top-12 right-12">
        <div className="w-6 h-6 text-[#F7B731]">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
          </svg>
        </div>
      </div>

      {/* Trophy/Result icon */}
      <div className="mb-6">
        {percentage >= 70 ? (
          <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-5xl">🏆</span>
          </div>
        ) : (
          <div className="w-24 h-24 bg-blue-400 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-5xl">📚</span>
          </div>
        )}
      </div>

      {/* Result message */}
      <h2 className="text-3xl font-bold text-gray-800 mb-2">
        {percentage >= 90 ? "Xuất sắc!" : 
         percentage >= 70 ? "Tốt lắm!" : 
         percentage >= 50 ? "Cố gắng hơn nhé!" : 
         "Hãy thử lại!"}
      </h2>

      {/* Score */}
      <div className="flex items-center gap-4 my-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <p className="text-gray-500 text-sm mb-1">Điểm số</p>
          <p className="text-4xl font-bold text-[#4A90D9]">{correctCount}/{totalCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <p className="text-gray-500 text-sm mb-1">Tỷ lệ</p>
          <p className="text-4xl font-bold text-[#7BC74D]">{percentage}%</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
          <p className="text-gray-500 text-sm mb-1">Thời gian</p>
          <p className="text-lg font-bold text-gray-700">{formatTime(totalTime)}</p>
        </div>
      </div>

      {/* Stars based on score */}
      <div className="flex gap-2 mb-6">
        {[...Array(3)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "w-10 h-10 transition-all",
              (percentage >= 33 * (i + 1)) 
                ? "text-yellow-500 fill-yellow-500" 
                : "text-gray-300"
            )}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-4">
        <button
          onClick={onRetry}
          className="px-6 py-3 bg-white border-2 border-[#4A90D9] text-[#4A90D9] font-semibold rounded-full hover:bg-[#4A90D9] hover:text-white transition-colors"
        >
          Làm lại
        </button>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-[#4A90D9] text-white font-semibold rounded-full hover:bg-[#3A7BC8] transition-colors shadow-lg"
        >
          Hoàn thành
        </button>
      </div>
    </div>
  );
}

// Main ExercisePlayer Component
export default function ExercisePlayer({
  exercises,
  lessonTitle,
  userAvatar,
  onComplete,
  onClose,
}: ExercisePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // States
  const [gameState, setGameState] = useState<'start' | 'playing' | 'result'>('start');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);
  const [countdown, setCountdown] = useState(TIME_LIMIT);
  const [showAnswerCountdown, setShowAnswerCountdown] = useState(SHOW_ANSWER_DURATION);

  // Filter multiple choice exercises only
  const multipleChoiceExercises = exercises.filter(e => e.type === 'MULTIPLE_CHOICE');
  const currentExercise = multipleChoiceExercises[currentIndex];

  // Use ref to track if we're transitioning to prevent double execution
  const isTransitioning = useRef(false);

  // Debug log
  useEffect(() => {
    console.log('[ExercisePlayer] State:', { 
      currentIndex, 
      submitted, 
      countdown, 
      showAnswerCountdown,
      gameState,
      exerciseId: currentExercise?.id 
    });
  }, [currentIndex, submitted, countdown, showAnswerCountdown, gameState, currentExercise?.id]);

  // Countdown timer for answering (10s)
  useEffect(() => {
    if (gameState !== 'playing' || submitted) return;
    
    console.log('[Timer] Starting countdown for question', currentIndex + 1);
    
    const interval = setInterval(() => {
      setCountdown(prev => {
        console.log('[Timer] Countdown:', prev - 1);
        if (prev <= 1) {
          // Time's up - auto fail
          console.log('[Timer] Time up! Auto fail');
          setSelectedAnswers([]);
          setIsCorrect(false);
          setSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent(prev => prev + 1);
      setTotalTime(prev => prev + 1);
    }, 1000);
    
    return () => {
      console.log('[Timer] Clearing countdown interval');
      clearInterval(interval);
    };
  }, [gameState, submitted, currentIndex]);

  // Show answer countdown (5s) then auto-next
  useEffect(() => {
    if (gameState !== 'playing' || !submitted) return;
    
    console.log('[ShowAnswer] Starting show answer countdown for question', currentIndex + 1);
    isTransitioning.current = false;
    let localCountdown = SHOW_ANSWER_DURATION;
    setShowAnswerCountdown(SHOW_ANSWER_DURATION);
    
    const interval = setInterval(() => {
      localCountdown -= 1;
      console.log('[ShowAnswer] Countdown:', localCountdown);
      setShowAnswerCountdown(localCountdown);
      
      if (localCountdown <= 0 && !isTransitioning.current) {
        isTransitioning.current = true;
        console.log('[ShowAnswer] Moving to next question. Current:', currentIndex + 1, 'Total:', multipleChoiceExercises.length);
        
        // Save result
        const result: ExerciseResult = {
          exerciseId: currentExercise?.id || '',
          isCorrect,
          selectedAnswers,
          timeSpent,
        };
        
        setResults(prev => [...prev, result]);
        
        // Check if last question
        if (currentIndex >= multipleChoiceExercises.length - 1) {
          console.log('[ShowAnswer] Last question - showing results');
          setResults(prev => {
            onComplete?.(prev);
            return prev;
          });
          setGameState('result');
        } else {
          // Move to next question
          console.log('[ShowAnswer] Moving to question', currentIndex + 2);
          setCurrentIndex(currentIndex + 1);
          setSubmitted(false);
          setSelectedAnswers([]);
          setIsCorrect(false);
          setTimeSpent(0);
          setCountdown(TIME_LIMIT);
        }
        
        clearInterval(interval);
      }
    }, 1000);
    
    return () => {
      console.log('[ShowAnswer] Clearing show answer interval');
      clearInterval(interval);
    };
  }, [submitted, currentIndex, gameState]);

  // Handle timeout - auto submit as fail
  const handleTimeOut = useCallback(() => {
    if (submitted) return;
    setSelectedAnswers([]);
    setIsCorrect(false);
    setSubmitted(true);
  }, [submitted]);

  // Start game
  const handleStart = () => {
    setGameState('playing');
    setCurrentIndex(0);
    setResults([]);
    setTimeSpent(0);
    setTotalTime(0);
    setSubmitted(false);
    setSelectedAnswers([]);
    setCountdown(TIME_LIMIT);
    setShowAnswerCountdown(SHOW_ANSWER_DURATION);
  };

  // Handle answer - auto submit on click
  const handleAnswer = useCallback((answers: string[]) => {
    if (submitted) return;
    
    const choices = parseChoices(currentExercise.options);
    const correctCount = choices.filter(c => c.isCorrect).length;
    const isMultiple = correctCount > 1;
    
    let correct = false;
    if (isMultiple) {
      const correctIndices = choices.map((c, i) => c.isCorrect ? i : -1).filter(i => i !== -1);
      const selectedIndices = answers.map(Number);
      const allCorrectSelected = correctIndices.every(i => selectedIndices.includes(i));
      const noIncorrectSelected = selectedIndices.every(i => choices[i].isCorrect);
      correct = allCorrectSelected && noIncorrectSelected && correctIndices.length === selectedIndices.length;
    } else {
      const selectedIndex = parseInt(answers[0]);
      correct = choices[selectedIndex]?.isCorrect || false;
    }

    setSelectedAnswers(answers);
    setIsCorrect(correct);
    setSubmitted(true);
    setShowAnswerCountdown(SHOW_ANSWER_DURATION);

    // Trigger confetti for correct answer
    if (correct) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }, [submitted, currentExercise]);

  // Go to next question
  const handleNextQuestion = useCallback(() => {
    // Save result
    const result: ExerciseResult = {
      exerciseId: currentExercise.id,
      isCorrect,
      selectedAnswers,
      timeSpent,
    };
    setResults(prev => [...prev, result]);

    // Move to next or show results
    if (currentIndex < multipleChoiceExercises.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSubmitted(false);
      setSelectedAnswers([]);
      setIsCorrect(false);
      setTimeSpent(0);
      setCountdown(TIME_LIMIT);
      setShowAnswerCountdown(SHOW_ANSWER_DURATION);
    } else {
      setGameState('result');
      onComplete?.([...results, result]);
    }
  }, [currentExercise, isCorrect, selectedAnswers, timeSpent, currentIndex, multipleChoiceExercises.length, results, onComplete]);

  // Fullscreen
  const handleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  };

  // Handle close/retry
  const handleClose = () => {
    setGameState('start');
    onClose?.();
  };

  const handleRetry = () => {
    handleStart();
  };

  // If no exercises
  if (multipleChoiceExercises.length === 0) {
    return (
      <div 
        className="w-full min-h-[300px] rounded-2xl flex items-center justify-center"
        style={{ backgroundColor: '#FFF8DD' }}
      >
        <div className="text-center">
          <HelpCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Chưa có bài tập trắc nghiệm cho bài học này</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      {gameState === 'start' && (
        <ExerciseStartScreen
          exerciseCount={multipleChoiceExercises.length}
          lessonTitle={lessonTitle}
          onStart={handleStart}
        />
      )}

      {gameState === 'playing' && currentExercise && (
        <>
          <QuestionScreen
            exercise={currentExercise}
            questionNumber={currentIndex + 1}
            totalQuestions={multipleChoiceExercises.length}
            countdown={countdown}
            onAnswer={handleAnswer}
            onShowHelp={() => setShowHelp(true)}
            onNextQuestion={handleNextQuestion}
            soundEnabled={soundEnabled}
            musicEnabled={musicEnabled}
            onToggleSound={() => setSoundEnabled(!soundEnabled)}
            onToggleMusic={() => setMusicEnabled(!musicEnabled)}
            onFullscreen={handleFullscreen}
            onClose={handleClose}
            submitted={submitted}
            selectedAnswers={selectedAnswers}
            isCorrect={isCorrect}
            showAnswerCountdown={showAnswerCountdown}
            userAvatar={userAvatar}
            lessonTitle={lessonTitle}
          />
          <HelpModal
            isOpen={showHelp}
            onClose={() => setShowHelp(false)}
            helpItems={[]}
          />
        </>
      )}

      {gameState === 'result' && (
        <ResultScreen
          results={results}
          totalTime={totalTime}
          onRetry={handleRetry}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
